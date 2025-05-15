"use client";

import React, {useState, useEffect, useRef, useMemo} from 'react';
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
    Alert,
    Stepper,
    Step,
    StepLabel,
    Skeleton,
    Badge,
    Backdrop,
    LinearProgress
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
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined';
import BiotechIcon from '@mui/icons-material/Biotech';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FirebaseService from '../../../lib/firebaseService';
import { useAuth } from '../authProvider';
import ExamTable from "./examTable";
import { createWorker } from 'tesseract.js';

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
            light: '#DCFCE7',
        },
        error: {
            main: '#F04438',
            light: '#FEE4E2',
        },
        warning: {
            main: '#F79009',
            light: '#FEF0C7',
        },
        info: {
            main: '#3B82F6',
            light: '#DBEAFE',
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

const OcrTipsDialog = ({ open, onClose }) => (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Dicas para melhorar o reconhecimento de texto
            </Typography>

            <Box component="ul" sx={{ pl: 3 }}>
                <Typography component="li" sx={{ mb: 1 }}>Certifique-se que o texto está bem iluminado e nítido</Typography>
                <Typography component="li" sx={{ mb: 1 }}>Evite reflexos, dobras ou sombras no documento</Typography>
                <Typography component="li" sx={{ mb: 1 }}>Posicione a câmera diretamente acima do documento</Typography>
                <Typography component="li" sx={{ mb: 1 }}>Use um fundo com contraste com o documento</Typography>
                <Typography component="li" sx={{ mb: 1 }}>Para PDFs escaneados, use uma resolução mínima de 300 DPI</Typography>
                <Typography component="li" sx={{ mb: 1 }}>Documentos impressos geralmente funcionam melhor que manuscritos</Typography>
                <Typography component="li" sx={{ mb: 1 }}>Tente recortar apenas a área que contém os resultados do exame</Typography>
            </Box>

            <Button
                variant="contained"
                fullWidth
                onClick={onClose}
                sx={{ mt: 2 }}
            >
                Entendi
            </Button>
        </DialogContent>
    </Dialog>
);

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

// Adicione este componente antes do ExamDialog principal
const ErrorFeedback = ({ message, onDismiss }) => (
    <Paper
        elevation={0}
        sx={{
            p: 2,
            mb: 3,
            borderRadius: '8px',
            border: `1px solid ${theme.palette.error.light}`,
            backgroundColor: alpha(theme.palette.error.light, 0.3),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ErrorOutlineIcon color="error" sx={{ mr: 1.5 }} />
            <Typography sx={{ color: theme.palette.error.dark }}>
                {message || "Ocorreu um erro. Por favor, tente novamente."}
            </Typography>
        </Box>

        {onDismiss && (
            <IconButton size="small" onClick={onDismiss} sx={{ ml: 1 }}>
                <CloseIcon fontSize="small" />
            </IconButton>
        )}
    </Paper>
);



// E atualize a função showNotification para lidar com erros persistentes
const showNotification = (message, severity = 'success') => {
    // Se for um erro crítico, exibir no componente de erro em vez de notificação
    if (severity === 'error' && message.includes('crítico')) {
        setErrorMessage(message);
    } else {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    }
};

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
    const [currentProcessingFile, setCurrentProcessingFile] = useState(null);

    const [isLoading, setIsLoading] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [showTips, setShowTips] = useState(false);
    const [showOcrTips, setShowOcrTips] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [processingInBrowser, setProcessingInBrowser] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrStatus, setOcrStatus] = useState('');

    // Função para mostrar notificações
    const showNotification = (message, severity = 'success') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    // Dicas de processamento
    // Dicas de processamento
    const processingTips = [
        "Os melhores resultados são obtidos com PDFs gerados digitalmente, não escaneados.",
        "PDFs com texto selecionável produzem resultados melhores e mais rápidos.",
        "Arquivos DOCX também são suportados para processamento automático.",
        "Imagens de exames (JPG, PNG, GIF) são processadas usando OCR para extrair os dados.",
        "Para melhores resultados com imagens, certifique-se que o texto esteja nítido e bem iluminado.",
        "Evite imagens com reflexos, sombras ou texto borrado para melhor precisão.",
        "O processamento extrai dados de exames laboratoriais de todas as categorias disponíveis.",
        "Após o processamento, você pode ajustar manualmente quaisquer valores incorretos.",
        "Arquivos muito grandes ou complexos podem ser truncados para processamento.",
        "Se o processamento falhar, verifique a qualidade do arquivo e tente novamente."
    ];

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
        setCurrentProcessingFile(null);
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

    const processImageInBrowser = async (file) => {
        try {
            setIsLoading(true);
            setProcessingInBrowser(true);
            setOcrStatus('Iniciando processamento OCR...');
            setOcrProgress(0);

            // Criar worker com configuração correta
            const worker = await createWorker({
                logger: (m) => {
                    // Atualizar progresso com base nos logs
                    if (m.status === 'recognizing text') {
                        setOcrProgress(m.progress * 100);
                    }
                    setOcrStatus(m.status || 'Processando...');
                },
                langPath: 'https://tessdata.projectnaptha.com/4.0.0',
                gzip: true,
            });

            // Carregar e inicializar o idioma português
            setOcrStatus('Carregando idioma...');
            await worker.loadLanguage('por');
            await worker.initialize('por');

            // Configurar melhor precisão (não é obrigatório, mas ajuda)
            await worker.setParameters({
                tessedit_ocr_engine_mode: 2, // Modo mais preciso (LSTM)
                preserve_interword_spaces: 1, // Preservar espaços entre palavras
            });

            // Processar a imagem
            setOcrStatus('Extraindo texto da imagem...');
            const { data } = await worker.recognize(file);

            // Liberar recursos
            await worker.terminate();

            // Verificar se temos texto suficiente
            if (data.text && data.text.length > 50) {
                setOcrStatus('Enviando texto para processamento...');

                // Enviar o texto extraído para o servidor processar
                const response = await fetch('/api/exame', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: data.text,
                        extractType: 'exam'
                    })
                });

                const result = await response.json();

                // Processar o resultado
                if (result.success && result.data) {
                    // Atualizar resultados no estado
                    setExamResults(result.data);

                    // Mostrar a tabela de resultados automaticamente
                    setShowExamTable(true);

                    // Atualizar título se necessário
                    if (!title.trim()) {
                        try {
                            const category = examCategories.find(cat => cat.id === examCategory);
                            const categoryName = category ? category.name : '';
                            const formattedDate = formatDateDisplay(examDate);
                            setTitle(`${categoryName} - ${formattedDate}`);
                        } catch (titleError) {
                            console.error("Erro ao gerar título:", titleError);
                        }
                    }

                    // Adicionar observação sobre processamento
                    if (!observations.includes('Processado automaticamente')) {
                        setObservations(prev =>
                            `${prev ? prev + '\n\n' : ''}Processado automaticamente pela IA em ${new Date().toLocaleString()}.`
                        );
                    }

                    showNotification("Imagem processada com sucesso! Resultados extraídos.", "success");
                    return true;
                } else {
                    showNotification(result.warning || "O processamento não encontrou resultados de exame", "warning");
                    return false;
                }
            } else {
                showNotification("Texto insuficiente extraído. Tente uma imagem com texto mais claro.", "warning");
                return false;
            }
        } catch (error) {
            console.error('Erro ao processar imagem no browser:', error);
            showNotification(`Não foi possível processar a imagem: ${error.message}`, "error");
            return false;
        } finally {
            setIsLoading(false);
            setProcessingInBrowser(false);
            setOcrStatus('');
        }
    };

    // Adicione esta função utilitária no início do componente ExamDialog
    const detectFileType = (file) => {
        try {
            // Verificar se temos um objeto de arquivo válido
            if (!file) return { isPdf: false, isDocx: false, isImage: false, isSupported: false };

            // Obter tipo a partir do MIME type ou nome do arquivo
            const fileName = file.fileName || file.name || '';
            const fileType = file.fileType || file.type || '';
            const fileExt = fileName.toLowerCase().split('.').pop();

            // Verificar cada tipo
            const isPdf = fileType === 'application/pdf' || fileExt === 'pdf';
            const isDocx = fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                fileExt === 'docx' || fileExt === 'doc';
            const isImage = fileType.startsWith('image/') ||
                ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExt);

            return {
                isPdf,
                isDocx,
                isImage,
                isSupported: isPdf || isDocx || isImage
            };
        } catch (error) {
            console.error("Erro ao detectar tipo de arquivo:", error);
            // Em caso de erro, retornar valor padrão seguro
            return { isPdf: false, isDocx: false, isImage: false, isSupported: false };
        }
    };

    // Attachment chip with better styling
    const AttachmentChip = ({ file, onOpen, onRemove, onProcess, disabled }) => {
        // Usar a função detectFileType para segurança
        const { isPdf, isDocx, isImage } = detectFileType(file);

        const getFileIcon = () => {
            try {
                if (isPdf) return <PictureAsPdfIcon sx={{ color: "#EF4444", fontSize: '18px' }} />;
                if (isDocx) return <DescriptionOutlinedIcon sx={{ color: "#3B82F6", fontSize: '18px' }} />;
                if (isImage) return <ImageOutlinedIcon sx={{ color: "#10B981", fontSize: '18px' }} />;
                return <AttachFileOutlinedIcon sx={{ color: "#64748B", fontSize: '18px' }} />;
            } catch (error) {
                console.error("Erro ao renderizar ícone:", error);
                // Fallback em caso de erro
                return <AttachFileOutlinedIcon sx={{ color: "#64748B", fontSize: '18px' }} />;
            }
        };

        // Função segura para clicar no anexo
        const handleOpenSafely = () => {
            try {
                if (onOpen) onOpen();
            } catch (error) {
                console.error("Erro ao abrir anexo:", error);
                // Mostra feedback visual em vez de crashar
                alert("Não foi possível abrir este anexo. Por favor, tente novamente.");
            }
        };

        // Função segura para remover o anexo
        const handleRemoveSafely = () => {
            try {
                if (onRemove) onRemove();
            } catch (error) {
                console.error("Erro ao remover anexo:", error);
                alert("Não foi possível remover este anexo. Por favor, tente novamente.");
            }
        };

        // Função segura para processar o anexo
        const handleProcessSafely = () => {
            try {
                if (onProcess) onProcess();
            } catch (error) {
                console.error("Erro ao processar anexo:", error);
                alert("Não foi possível processar este anexo. Por favor, tente novamente.");
            }
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
                    onClick={handleOpenSafely}
                >
                    <Box sx={{ mr: 1.5, fontSize: '16px', display: 'flex', alignItems: 'center' }}>
                        {getFileIcon()}
                    </Box>
                    <Typography sx={{ color: '#475467', fontWeight: 500 }}>
                        {file.fileName || "Anexo"}
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
                        {file.fileSize || ""}
                    </Typography>
                </Box>

                {/* Mostrar botão de processar para PDF/DOCX/Imagens */}
                {(isPdf || isDocx || isImage) && onProcess && (
                    <Tooltip title="Processar com IA">
                        <IconButton
                            size="small"
                            onClick={handleProcessSafely}
                            disabled={disabled}
                            color="primary"
                            sx={{
                                ml: 0.5,
                                p: 0.5,
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                }
                            }}
                        >
                            <AutoAwesomeIcon fontSize="small" sx={{ fontSize: '16px' }} />
                        </IconButton>
                    </Tooltip>
                )}

                <Tooltip title="Remover anexo">
                    <IconButton
                        size="small"
                        onClick={handleRemoveSafely}
                        disabled={disabled}
                        sx={{
                            ml: 0.5,
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
                </Tooltip>
            </Box>
        );
    };

    // NOVA FUNÇÃO: Processar arquivo PDF/DOCX/Imagem com IA
    const processExamFile = async (file) => {
        // Se não recebemos um arquivo válido, não tente processar
        if (!file) {
            showNotification("Arquivo inválido", "error");
            return false;
        }

        try {
            // Verificar se é um arquivo processável usando nossa função de detecção segura
            const { isPdf, isDocx, isImage, isSupported } = detectFileType(file);

            if (!isSupported) {
                showNotification("Por favor, selecione um arquivo PDF, DOCX ou imagem válida", "warning");
                return false;
            }

            setIsLoading(true);

            // Feedback específico por tipo de arquivo
            if (isImage) {
                console.log("Processando imagem no browser com OCR");
                return await processImageInBrowser(file);
            } else if (isPdf) {
                setUploadProgress(`Processando PDF com IA...`);
            } else if (isDocx) {
                setUploadProgress(`Processando DOCX com IA...`);
            } else {
                setUploadProgress(`Processando arquivo...`);
            }

            setCurrentProcessingFile(file.name || file.fileName || "arquivo");

            // Iniciar animação de progresso
            setProcessingProgress(0);
            const progressInterval = setInterval(() => {
                setProcessingProgress(prev => {
                    try {
                        // Simular progresso até 90% (os últimos 10% quando a resposta chega)
                        const newProgress = prev + (Math.random() * 2);
                        return newProgress >= 90 ? 90 : newProgress;
                    } catch (error) {
                        console.error("Erro ao atualizar progresso:", error);
                        return prev; // Em caso de erro, manter o valor anterior
                    }
                });
            }, 300);

            try {
                // Enviar o arquivo diretamente para a API processar
                const formData = new FormData();
                try {
                    // Tentar adicionar o arquivo ao FormData
                    formData.append('file', file);
                } catch (formError) {
                    console.error("Erro ao criar FormData:", formError);

                    // Se falhar, tentar com um Blob ou outro método
                    if (file.arrayBuffer) {
                        try {
                            const buffer = await file.arrayBuffer();
                            const blob = new Blob([buffer], { type: file.type || 'application/octet-stream' });
                            formData.append('file', blob, file.name || file.fileName || 'arquivo');
                        } catch (blobError) {
                            console.error("Erro ao criar Blob:", blobError);
                            throw new Error("Não foi possível processar este arquivo");
                        }
                    } else {
                        throw new Error("Formato de arquivo não suportado");
                    }
                }

                // Chamar a API exame com o arquivo
                let response;
                try {
                    response = await fetch('/api/exame', {
                        method: 'POST',
                        body: formData,
                    });
                } catch (fetchError) {
                    console.error("Erro na requisição:", fetchError);
                    throw new Error("Falha na conexão com o servidor. Verifique sua internet.");
                }

                clearInterval(progressInterval);
                setProcessingProgress(100);

                // Atraso para o usuário ver que chegou a 100%
                await new Promise(resolve => setTimeout(resolve, 500));

                if (!response.ok) {
                    let errorMessage = "Erro ao processar arquivo";
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.error || errorData.details || `Erro na API: ${response.status}`;
                    } catch (jsonError) {
                        console.error("Erro ao processar resposta de erro:", jsonError);
                        errorMessage = `Erro no servidor: ${response.status}`;
                    }
                    throw new Error(errorMessage);
                }

                let result;
                try {
                    result = await response.json();
                } catch (jsonError) {
                    console.error("Erro ao processar resposta JSON:", jsonError);
                    throw new Error("Resposta inválida do servidor");
                }

                if (result.success && result.data) {
                    try {
                        // Atualizar os resultados no estado
                        setExamResults(result.data);

                        // Mostrar a tabela de resultados automaticamente
                        setShowExamTable(true);

                        // Sugerir título baseado na categoria ou data
                        if (!title.trim()) {
                            try {
                                const category = examCategories.find(cat => cat.id === examCategory);
                                const categoryName = category ? category.name : '';
                                const formattedDate = formatDateDisplay(examDate);
                                setTitle(`${categoryName} - ${formattedDate}`);
                            } catch (titleError) {
                                console.error("Erro ao gerar título:", titleError);
                                // Não exibir erro ao usuário para não interromper o fluxo principal
                            }
                        }

                        // Adicionar observação sobre processamento automático
                        try {
                            if (!observations.includes('Processado automaticamente')) {
                                setObservations(prev =>
                                    `${prev ? prev + '\n\n' : ''}Processado automaticamente pela IA em ${new Date().toLocaleString()}.`
                                );
                            }
                        } catch (obsError) {
                            console.error("Erro ao atualizar observações:", obsError);
                            // Não exibir erro ao usuário para não interromper o fluxo principal
                        }

                        showNotification("Arquivo processado com sucesso! Resultados extraídos.", "success");
                        return true;
                    } catch (stateError) {
                        console.error("Erro ao atualizar estado com resultados:", stateError);
                        // Mesmo com erro no estado, tentamos mostrar resultados parciais
                        showNotification("Arquivo processado, mas houve um erro ao exibir resultados. Tente novamente.", "warning");
                        return false;
                    }
                } else if (result.warning) {
                    // Caso não encontre resultados, mas não seja um erro
                    showNotification(result.warning, "warning");
                    return false;
                } else {
                    throw new Error("Falha ao processar o resultado");
                }
            } catch (error) {
                console.error('Erro ao processar o arquivo:', error);
                showNotification(`Não foi possível processar o arquivo: ${error.message}`, "error");
                return false;
            } finally {
                // Garantir que o intervalo seja limpo em todos os casos
                if (progressInterval) clearInterval(progressInterval);

                setIsLoading(false);
                setUploadProgress(null);
                setCurrentProcessingFile(null);
                setProcessingProgress(0);
            }
        } catch (globalError) {
            // Captura qualquer erro inesperado em todo o processo
            console.error("Erro global ao processar arquivo:", globalError);
            showNotification("Ocorreu um erro inesperado. Por favor, tente novamente.", "error");

            // Garantir que o estado seja limpo mesmo em caso de erro catastrófico
            setIsLoading(false);
            setUploadProgress(null);
            setCurrentProcessingFile(null);
            setProcessingProgress(0);

            return false;
        }
    };

    // Função para processar arquivos carregados
    const processFiles = async (files) => {
        try {
            if (!files || files.length === 0) return;

            // Evitar processamento de muitos arquivos simultaneamente
            const MAX_FILES = 10;
            let fileList = Array.from(files);

            if (fileList.length > MAX_FILES) {
                showNotification(`Limite de ${MAX_FILES} arquivos por vez. Processando apenas os primeiros ${MAX_FILES}.`, "warning");
                fileList = fileList.slice(0, MAX_FILES);
            }

            // Verificar se há arquivos PDF, DOCX ou imagens para processamento automático
            const processableFiles = fileList.filter(file => {
                const { isSupported } = detectFileType(file);
                return isSupported;
            });

            // Se não há arquivos processáveis
            if (processableFiles.length === 0 && fileList.length > 0) {
                showNotification("Nenhum arquivo selecionado pode ser processado. Use PDF, DOCX ou imagens.", "warning");
            }

            // Se houver um arquivo processável, tentar processá-lo primeiro com IA
            let processingResult = false;
            if (processableFiles.length > 0) {
                try {
                    const fileToProcess = processableFiles[0];
                    processingResult = await processExamFile(fileToProcess);
                } catch (error) {
                    console.error("Erro ao processar arquivo automaticamente:", error);
                    showNotification("O processamento automático falhou. O arquivo será anexado normalmente.", "warning");
                    // Continuar com o upload normal mesmo se o processamento falhar
                }
            }

            // Para exames em modo de edição, fazer upload dos arquivos
            if (isEditMode && exam && exam.id) {
                setIsLoading(true);
                setUploadProgress('Fazendo upload dos arquivos...');

                try {
                    let successCount = 0;
                    let errorCount = 0;

                    for (const file of fileList) {
                        try {
                            const fileInfo = await FirebaseService.uploadExamAttachment(
                                file,
                                user.uid,
                                patientId,
                                exam.id
                            );
                            setAttachments(prev => [...prev, fileInfo]);
                            successCount++;
                        } catch (uploadError) {
                            console.error(`Erro ao fazer upload do arquivo ${file.name}:`, uploadError);
                            errorCount++;
                        }
                    }

                    // Mensagem de feedback baseada no resultado
                    if (successCount > 0 && errorCount === 0) {
                        showNotification(`${successCount} arquivo${successCount > 1 ? 's' : ''} enviado${successCount > 1 ? 's' : ''} com sucesso!`);
                    } else if (successCount > 0 && errorCount > 0) {
                        showNotification(`${successCount} arquivo${successCount > 1 ? 's' : ''} enviado${successCount > 1 ? 's' : ''}, mas ${errorCount} falhou.`, "warning");
                    } else if (errorCount > 0) {
                        showNotification(`Falha ao enviar ${errorCount} arquivo${errorCount > 1 ? 's' : ''}. Tente novamente.`, "error");
                    }
                } catch (error) {
                    console.error("Erro ao fazer upload dos arquivos:", error);
                    showNotification("Erro ao fazer upload dos arquivos. Tente novamente.", "error");
                } finally {
                    setIsLoading(false);
                    setUploadProgress(null);
                }
            } else {
                // Para novos exames, apenas armazenar informações e o objeto do arquivo
                try {
                    const newAttachments = fileList.map(file => {
                        try {
                            return {
                                fileName: file.name || "arquivo",
                                fileType: file.type || "application/octet-stream",
                                fileSize: formatFileSize(file.size || 0),
                                file: file, // Manter o objeto do arquivo para upload posterior
                                uploadedAt: new Date()
                            };
                        } catch (fileError) {
                            console.error("Erro ao processar informações do arquivo:", fileError);
                            return {
                                fileName: "arquivo desconhecido",
                                fileType: "application/octet-stream",
                                fileSize: "desconhecido",
                                file: file,
                                uploadedAt: new Date(),
                                hasError: true
                            };
                        }
                    });

                    setAttachments(prev => [...prev, ...newAttachments]);

                    if (fileList.length > 0 && !processingResult) {
                        showNotification(`${fileList.length} arquivo${fileList.length > 1 ? 's' : ''} adicionado${fileList.length > 1 ? 's' : ''} e será${fileList.length > 1 ? 'ão' : ''} enviado${fileList.length > 1 ? 's' : ''} ao salvar o exame.`);
                    }
                } catch (attachError) {
                    console.error("Erro ao adicionar anexos:", attachError);
                    showNotification("Erro ao adicionar anexos. Tente novamente.", "error");
                }
            }
        } catch (globalError) {
            console.error("Erro global no processamento de arquivos:", globalError);
            showNotification("Ocorreu um erro inesperado. Por favor, tente novamente.", "error");
        }
    };

    // Função para processar anexo existente
    const handleProcessExistingAttachment = async (attachment) => {
        if (!attachment) {
            showNotification("Anexo inválido", "error");
            return false;
        }

        try {
            // Verificar se já temos um file object
            if (attachment.file) {
                return await processExamFile(attachment.file);
            }

            // Se não temos o objeto file diretamente, mas temos URL
            if (attachment.fileUrl) {
                setIsLoading(true);

                // Detectar tipo para feedback específico
                const { isPdf, isDocx, isImage } = detectFileType(attachment);

                if (isImage) {
                    setUploadProgress('Baixando imagem para OCR...');
                } else if (isPdf) {
                    setUploadProgress('Baixando PDF para processamento...');
                } else if (isDocx) {
                    setUploadProgress('Baixando DOCX para processamento...');
                } else {
                    setUploadProgress('Baixando arquivo para processamento...');
                }

                setCurrentProcessingFile(attachment.fileName || "arquivo");

                try {
                    // Baixar o arquivo da URL com timeout
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

                    const response = await fetch(attachment.fileUrl, {
                        signal: controller.signal
                    }).finally(() => clearTimeout(timeoutId));

                    if (!response.ok) throw new Error("Falha ao obter o arquivo do servidor");

                    const blob = await response.blob();
                    const file = new File([blob], attachment.fileName || "arquivo", {
                        type: attachment.fileType || 'application/octet-stream'
                    });

                    // Processar o arquivo
                    return await processExamFile(file);
                } catch (error) {
                    if (error.name === 'AbortError') {
                        console.error('Timeout ao baixar arquivo:', error);
                        showNotification('O download do arquivo demorou muito. Verifique sua conexão.', "error");
                    } else {
                        console.error('Erro ao processar anexo da URL:', error);
                        showNotification('Não foi possível processar o anexo: ' + error.message, "error");
                    }
                    setIsLoading(false);
                    setUploadProgress(null);
                    setCurrentProcessingFile(null);
                    return false;
                }
            } else {
                showNotification("Não foi possível acessar o conteúdo do arquivo", "error");
                return false;
            }
        } catch (error) {
            console.error("Erro inesperado ao processar anexo:", error);
            showNotification("Ocorreu um erro ao processar o anexo. Tente novamente.", "error");

            // Garantir limpeza do estado
            setIsLoading(false);
            setUploadProgress(null);
            setCurrentProcessingFile(null);

            return false;
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

        let saveAttempts = 0;
        const maxAttempts = 3;
        let savedSuccessfully = false;

        while (saveAttempts < maxAttempts && !savedSuccessfully) {
            saveAttempts++;

            try {
                setIsLoading(true);

                // Feedback com tentativa atual
                if (saveAttempts > 1) {
                    setUploadProgress(`Tentativa ${saveAttempts}/${maxAttempts} de salvar o exame...`);
                } else {
                    setUploadProgress("Salvando exame...");
                }

                let exameId = exam?.id;
                // 1) Criar ou atualizar o exame
                if (isEditMode && exameId) {
                    await FirebaseService.updateExam(user.uid, patientId, exameId, {
                        title,
                        examDate,
                        category: examCategory,
                        observations,
                        attachments: attachments.map(att => {
                            // Remover campos que não devem ser salvos
                            const { file, ...meta } = att;
                            return meta;
                        }),
                        results: examResults,
                        lastModified: new Date()
                    });
                } else {
                    // para novo exame, crie primeiro sem anexos
                    const examData = {
                        title,
                        examDate,
                        category: examCategory,
                        observations,
                        attachments: attachments.map(att => {
                            const { file, ...meta } = att;
                            return meta;
                        }),
                        results: examResults,
                        createdAt: new Date(),
                        lastModified: new Date()
                    };
                    exameId = await FirebaseService.createExam(user.uid, patientId, examData);
                }

                // 2) (Re)envio de quaisquer anexos pendentes
                const uploadPromises = [];
                for (const att of attachments) {
                    if (att.file) {
                        const uploadPromise = FirebaseService.uploadExamAttachment(
                            att.file,
                            user.uid,
                            patientId,
                            exameId
                        ).then(info => {
                            // Atualizar o state local com as URLs dos arquivos (opcional)
                            console.log("Arquivo enviado:", info);
                        }).catch(error => {
                            console.error("Erro ao enviar anexo:", error);
                            // Registrar erro mas não falhar completamente
                            return null;
                        });
                        uploadPromises.push(uploadPromise);
                    }
                }

                if (uploadPromises.length > 0) {
                    // Usar allSettled para não falhar se um upload específico falhar
                    const results = await Promise.allSettled(uploadPromises);
                    const failedUploads = results.filter(r => r.status === 'rejected').length;

                    if (failedUploads > 0) {
                        console.warn(`${failedUploads} anexos não puderam ser enviados`);
                    }
                }

                // 3) Montar payload da nota de exame
                try {
                    const formattedDate = format(
                        new Date(examDate),
                        "dd 'de' MMMM 'de' yyyy",
                        { locale: ptBR }
                    );

                    const hasResults = Object.keys(examResults).length > 0;
                    const notePayload = {
                        noteTitle: `Exame - ${title}`,
                        noteText: `Exame realizado em ${formattedDate}.${
                            hasResults ? '\n\nExame processado com resultados estruturados.' : ''
                        }`,
                        noteType: "Exame",
                        consultationDate: new Date(examDate),
                        exameId,
                        createdAt: new Date()
                    };

                    // 4) Criar ou atualizar a nota no Firestore
                    const todasNotas = await FirebaseService.listNotes(user.uid, patientId);
                    const notaExistente = todasNotas.find(n => n.exameId === exameId);

                    if (notaExistente) {
                        await FirebaseService.updateNote(
                            user.uid,
                            patientId,
                            notaExistente.id,
                            {
                                noteTitle: `Exame - ${title}`,
                                noteText: `Exame atualizado em ${formattedDate}.${
                                    hasResults ? '\n\nExame possui resultados estruturados.' : ''
                                }`,
                                lastModified: new Date()
                            }
                        );
                    } else {
                        await FirebaseService.createNote(
                            user.uid,
                            patientId,
                            notePayload
                        );
                    }
                } catch (noteError) {
                    console.error("Erro ao criar nota associada:", noteError);
                    // Continuar mesmo se a nota falhar - o exame já foi salvo
                }

                // 5) Feedback e fechar
                savedSuccessfully = true;
                setIsSaved(true);
                showNotification("Exame salvo com sucesso!");
                setTimeout(() => {
                    onClose();
                    if (onSave) onSave(exameId);
                }, 1200);

            } catch (error) {
                console.error(`Erro ao salvar exame (tentativa ${saveAttempts}/${maxAttempts}):`, error);

                if (saveAttempts >= maxAttempts) {
                    showNotification(`Não foi possível salvar o exame após ${maxAttempts} tentativas. Por favor, tente novamente mais tarde.`, "error");
                } else {
                    // Esperar um pouco antes de tentar novamente
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } finally {
                if (!savedSuccessfully) {
                    setIsLoading(false);
                    setUploadProgress(null);
                }
            }
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

    // Verificar se temos anexos processáveis (PDF/DOCX/Imagens)
    const hasProcessableAttachments = useMemo(() => {
        try {
            return attachments.some(att => {
                try {
                    const { isSupported } = detectFileType(att);
                    return isSupported;
                } catch (error) {
                    console.error("Erro ao verificar tipo de anexo:", error);
                    return false;
                }
            });
        } catch (error) {
            console.error("Erro ao verificar anexos processáveis:", error);
            return false;
        }
    }, [attachments]);

    // Verificar se temos resultados já extraídos
    const hasExtractedResults = Object.keys(examResults).length > 0;

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
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton
                                onClick={onClose}
                                disabled={isLoading}
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    backgroundColor: '#F6F7F9',
                                    color: '#64748B',
                                    mr: 2,
                                    '&:hover': {
                                        backgroundColor: '#EAECEF',
                                        color: '#475467'
                                    }
                                }}
                            >
                                <ArrowBackIcon />
                            </IconButton>

                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#101828' }}>
                                {isEditMode ? 'Editar exame' : 'Novo exame'}
                            </Typography>

                            {/* Status indicator */}
                            {isLoading && (
                                <Fade in={true}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                                        <CircularProgress size={16} sx={{ mr: 1 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {uploadProgress || 'Processando...'}
                                        </Typography>
                                    </Box>
                                </Fade>
                            )}
                        </Box>

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
                            position: 'relative'
                        }}>
                            {/* Progress bar when processing */}
                            {isLoading && currentProcessingFile && (
                                <Backdrop
                                    open={true}
                                    sx={{
                                        position: 'fixed',
                                        zIndex: 9999,
                                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Paper
                                        elevation={3}
                                        sx={{
                                            p: 4,
                                            borderRadius: '16px',
                                            maxWidth: '420px',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 80,
                                                height: 80,
                                                borderRadius: '50%',
                                                backgroundColor: alpha(categoryColor.light, 0.3),
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '0 auto 20px'
                                            }}
                                        >
                                            <AutoAwesomeIcon
                                                sx={{
                                                    fontSize: 40,
                                                    color: categoryColor.main,
                                                    animation: 'pulse 1.5s infinite'
                                                }}
                                            />
                                        </Box>

                                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: categoryColor.dark }}>
                                            Processando com IA
                                        </Typography>

                                        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                                            {currentProcessingFile}
                                        </Typography>

                                        <Box sx={{ width: '100%', mb: 2 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={processingProgress}
                                                sx={{
                                                    height: 10,
                                                    borderRadius: 5,
                                                    backgroundColor: alpha(categoryColor.main, 0.2),
                                                    '& .MuiLinearProgress-bar': {
                                                        backgroundColor: categoryColor.main,
                                                        borderRadius: 5
                                                    }
                                                }}
                                            />
                                        </Box>

                                        <Typography variant="body2" color="text.secondary">
                                            {uploadProgress || `${Math.round(processingProgress)}% - Extraindo dados do documento...`}
                                        </Typography>

                                        <Box sx={{ mt: 3, fontSize: 12, color: 'text.secondary', fontStyle: 'italic' }}>
                                            Este processo pode levar alguns segundos dependendo do tamanho do arquivo
                                        </Box>
                                    </Paper>
                                </Backdrop>
                            )}

                            {/* Adicione este estilo para a animação de pulso */}
                            <style jsx global>{`
    @keyframes pulse {
        0% {
            filter: drop-shadow(0 0 0 ${categoryColor.main});
            transform: scale(1);
        }
        50% {
            filter: drop-shadow(0 0 10px ${alpha(categoryColor.main, 0.4)});
            transform: scale(1.1);
        }
        100% {
            filter: drop-shadow(0 0 0 ${categoryColor.main});
            transform: scale(1);
        }
    }
`}</style>
                            {/* Icon and Title */}
                            <Box sx={{
                                textAlign: 'center',
                                mb: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}>
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

                                {/* Dicas de processamento */}
                                <Button
                                    variant="text"
                                    startIcon={<TipsAndUpdatesOutlinedIcon />}
                                    onClick={() => setShowTips(!showTips)}
                                    sx={{
                                        mt: 1,
                                        color: theme.palette.info.main,
                                        textTransform: 'none',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                    }}
                                >
                                    {showTips ? 'Ocultar dicas' : 'Ver dicas de processamento'}
                                </Button>

                                {showTips && (
                                    <Fade in={showTips}>
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                mt: 2,
                                                p: 2,
                                                borderRadius: '8px',
                                                border: `1px solid ${theme.palette.info.light}`,
                                                bgcolor: alpha(theme.palette.info.light, 0.3),
                                                width: '100%',
                                                maxWidth: '600px'
                                            }}
                                        >
                                            <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.info.dark }}>
                                                Dicas para melhor processamento
                                            </Typography>
                                            <Box component="ul" sx={{ m: 0, pl: 3 }}>
                                                {processingTips.map((tip, index) => (
                                                    <Typography key={index} component="li" variant="body2" sx={{ mb: 0.5 }}>
                                                        {tip}
                                                    </Typography>
                                                ))}
                                                {errorMessage && (
                                                    <ErrorFeedback
                                                        message={errorMessage}
                                                        onDismiss={() => setErrorMessage(null)}
                                                    />
                                                )}
                                            </Box>
                                        </Paper>
                                    </Fade>
                                )}
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
                                        disabled={isLoading}
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
                                {isLoading && uploadProgress && !currentProcessingFile && (
                                    <Backdrop
                                        open={true}
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            backgroundColor: 'rgba(255,255,255,0.9)',
                                            zIndex: 10,
                                            borderRadius: '16px',
                                        }}
                                    >
                                        <Box sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            p: 3,
                                            backgroundColor: 'white',
                                            borderRadius: '12px',
                                            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.1)',
                                            maxWidth: '320px',
                                        }}>
                                            <CircularProgress size={40} color="primary" sx={{ mb: 2 }} />
                                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                                Processando
                                            </Typography>
                                            <Typography sx={{ fontSize: '15px', color: 'text.secondary', textAlign: 'center' }}>
                                                {uploadProgress}
                                            </Typography>
                                        </Box>
                                    </Backdrop>
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
                                        onChange={(e) => {
                                            try {
                                                handleFileInputChange(e);
                                            } catch (error) {
                                                console.error("Erro no upload de arquivo:", error);
                                                showNotification("Erro ao processar arquivos selecionados", "error");
                                            } finally {
                                                // Limpar o input para permitir selecionar o mesmo arquivo novamente
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }
                                        }}
                                        accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.gif,.bmp,.webp"
                                    />

                                    {/* Upload section header with badge showing count */}
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 2
                                    }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#344054' }}>
                                            Anexos e Processamento
                                        </Typography>

                                        {attachments.length > 0 && (
                                            <Badge
                                                badgeContent={attachments.length}
                                                color="primary"
                                                sx={{
                                                    '& .MuiBadge-badge': {
                                                        fontSize: '12px',
                                                        fontWeight: 'bold',
                                                        minWidth: '22px',
                                                        height: '22px',
                                                        borderRadius: '11px'
                                                    }
                                                }}
                                            >
                                                <AttachFileOutlinedIcon sx={{ color: theme.palette.grey[500] }} />
                                            </Badge>
                                        )}
                                    </Box>

                                    {/* Processamento automático info */}
                                    <Box sx={{
                                        mb: 3,
                                        p: 2,
                                        borderRadius: '8px',
                                        backgroundColor: alpha(theme.palette.info.light, 0.3),
                                        border: `1px solid ${theme.palette.info.light}`,
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}>
                                        <AutoAwesomeIcon
                                            sx={{
                                                color: theme.palette.info.main,
                                                mr: 2,
                                                fontSize: '20px'
                                            }}
                                        />
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ color: theme.palette.info.dark, fontWeight: 600 }}>
                                                Processamento Automático
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: theme.palette.grey[700] }}>
                                                Faça upload de um arquivo PDF ou DOCX para extrair automaticamente os resultados do exame.
                                            </Typography>
                                        </Box>
                                    </Box>

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
                                                Formatos suportados: PDF, DOC, DOCX, JPG, JPEG, PNG, GIF, BMP, WEBP
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
                                                    {/* Botão para processar com IA - mostrado somente quando há anexos processáveis */}
                                                    {hasProcessableAttachments && (
                                                        <Button
                                                            variant="outlined"
                                                            startIcon={<AutoAwesomeIcon />}
                                                            onClick={() => {
                                                                // Encontrar primeiro PDF/DOCX e processá-lo
                                                                const pdfOrDocx = attachments.find(att =>
                                                                    att.fileType === 'application/pdf' ||
                                                                    att.fileName?.toLowerCase().endsWith('.pdf') ||
                                                                    att.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                                                                    att.fileName?.toLowerCase().endsWith('.docx')
                                                                );

                                                                if (pdfOrDocx) {
                                                                    handleProcessExistingAttachment(pdfOrDocx);
                                                                }
                                                            }}
                                                            disabled={isLoading}
                                                            sx={{
                                                                height: 36,
                                                                color: categoryColor.main,
                                                                borderColor: categoryColor.main,
                                                                '&:hover': {
                                                                    backgroundColor: alpha(categoryColor.light, 0.3),
                                                                    borderColor: categoryColor.dark
                                                                }
                                                            }}
                                                        >
                                                            Processar com IA
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
                                                        Adicionar mais
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
                                                        onProcess={() => handleProcessExistingAttachment(file)}
                                                        disabled={isLoading}
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    )}

                                    {/* "Drop files here" overlay */}
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

                                {/* Exam Results Section */}
                                <Box sx={{ borderTop: '1px solid #EAECEF' }}>
                                    {/* Exam Results Table Toggle Button */}
                                    <Box sx={{
                                        p: 2,
                                        display: 'flex',
                                        justifyContent: 'center',
                                    }}>
                                        <Button
                                            variant={hasExtractedResults ? "contained" : "outlined"}
                                            color={hasExtractedResults ? "primary" : "inherit"}
                                            startIcon={showExamTable ? <KeyboardArrowUpOutlinedIcon /> : <KeyboardArrowDownOutlinedIcon />}
                                            endIcon={hasExtractedResults ? <Badge
                                                badgeContent={
                                                    Object.values(examResults).reduce((acc, category) => acc + Object.keys(category).length, 0)
                                                }
                                                color="success"
                                                sx={{
                                                    '& .MuiBadge-badge': {
                                                        fontSize: '10px',
                                                        height: '18px',
                                                        minWidth: '18px',
                                                        padding: '0 6px'
                                                    }
                                                }}
                                            >
                                                <BiotechIcon fontSize="small" />
                                            </Badge> : null}
                                            onClick={handleToggleExamTable}
                                            sx={{
                                                borderRadius: '8px',
                                                height: '48px',
                                                width: '100%',
                                                maxWidth: '400px',
                                                fontWeight: 600,
                                                ...(hasExtractedResults ? {
                                                    backgroundColor: categoryColor.main,
                                                    color: 'white',
                                                    '&:hover': {
                                                        backgroundColor: categoryColor.dark,
                                                    }
                                                } : {
                                                    borderColor: '#D0D5DD',
                                                    color: theme.palette.grey[700],
                                                    '&:hover': {
                                                        borderColor: theme.palette.grey[500],
                                                        backgroundColor: alpha(theme.palette.grey[100], 0.8),
                                                    }
                                                })
                                            }}
                                        >
                                            {showExamTable ? 'Ocultar resultados do exame' : (
                                                hasExtractedResults ? 'Ver resultados extraídos' : 'Tabela de resultados'
                                            )}
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
                                                    textAlign: 'center',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <BiotechIcon sx={{ mr: 1 }} />
                                                Resultados do Exame
                                            </Typography>

                                            <ExamTable
                                                results={examResults}
                                                onUpdateResults={setExamResults}
                                                readOnly={isLoading}
                                            />
                                        </Box>
                                    </Fade>
                                </Box>

                                {/* Actions Footer */}
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    p: 3,
                                    borderTop: '1px solid #EAECEF',
                                    bgcolor: '#fff'
                                }}>
                                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                        {hasExtractedResults
                                            ? `${Object.values(examResults).reduce((acc, category) => acc + Object.keys(category).length, 0)} resultados extraídos`
                                            : ''}
                                    </Typography>

                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <SecondaryButton
                                            onClick={onClose}
                                            disabled={isLoading}
                                        >
                                            Cancelar
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
                                            {isSaved ? "Salvo com sucesso!" : "Salvar exame"}
                                        </PrimaryButton>
                                    </Box>
                                </Box>
                            </Paper>
                        </Box>
                    </Box>
                </DialogContent>

                {processingInBrowser && (
                    <Backdrop
                        open={processingInBrowser}
                        sx={{
                            position: 'fixed',
                            zIndex: 9999,
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Paper
                            elevation={3}
                            sx={{
                                p: 4,
                                borderRadius: '16px',
                                maxWidth: '500px',
                                width: '90%',
                                textAlign: 'center'
                            }}
                        >
                            <Box
                                sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    backgroundColor: alpha(categoryColor.light, 0.3),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 20px'
                                }}
                            >
                                <CameraAltOutlinedIcon
                                    sx={{
                                        fontSize: 40,
                                        color: categoryColor.main,
                                        animation: ocrProgress > 0 && ocrProgress < 100 ? 'pulse 1.5s infinite' : 'none'
                                    }}
                                />
                            </Box>

                            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: categoryColor.dark }}>
                                Processando OCR no Navegador
                            </Typography>

                            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                                {ocrStatus || "Extraindo texto da imagem..."}
                            </Typography>

                            <Box sx={{ width: '100%', mb: 2 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={ocrProgress}
                                    sx={{
                                        height: 10,
                                        borderRadius: 5,
                                        backgroundColor: alpha(categoryColor.main, 0.2),
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: categoryColor.main,
                                            borderRadius: 5
                                        }
                                    }}
                                />
                            </Box>

                            <Typography variant="body2" color="text.secondary">
                                {ocrProgress > 0 ? `${Math.round(ocrProgress)}% - Texto sendo reconhecido` : 'Inicializando OCR...'}
                            </Typography>

                            <Button
                                variant="outlined"
                                color="inherit"
                                onClick={() => {
                                    setProcessingInBrowser(false);
                                    setOcrProgress(0);
                                    setOcrStatus('');
                                }}
                                sx={{ mt: 3 }}
                            >
                                Cancelar processamento
                            </Button>
                        </Paper>
                    </Backdrop>
                )}

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
                        variant="filled"
                        sx={{
                            width: '100%',
                            borderRadius: '10px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            fontWeight: 500
                        }}
                    >
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </StyledDialog>
            <OcrTipsDialog open={showOcrTips} onClose={() => setShowOcrTips(false)} />
        </ThemeProvider>
    );
};

export default ExamDialog;