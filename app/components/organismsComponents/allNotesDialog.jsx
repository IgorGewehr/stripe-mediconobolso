"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    Button,
    IconButton,
    Divider,
    Paper,
    Chip,
    Avatar,
    Card,
    CardContent,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Grid,
    Tooltip,
    useTheme,
    useMediaQuery,
    AppBar,
    Toolbar,
    Tabs,
    Tab,
    Badge,
    Slide,
    alpha
} from "@mui/material";
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Ícones
import CloseIcon from "@mui/icons-material/Close";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import MedicationIcon from "@mui/icons-material/Medication";
import EventNoteIcon from "@mui/icons-material/EventNote";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import AssignmentIcon from "@mui/icons-material/Assignment";
import NotesIcon from "@mui/icons-material/Notes";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WarningIcon from "@mui/icons-material/Warning";
import ImageIcon from "@mui/icons-material/Image";
import ArticleIcon from "@mui/icons-material/Article";
import LinkIcon from "@mui/icons-material/Link";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import SpeedIcon from "@mui/icons-material/Speed";
import BubbleChartIcon from "@mui/icons-material/BubbleChart";
import FavoriteIcon from "@mui/icons-material/Favorite";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import BiotechIcon from "@mui/icons-material/Biotech";

import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AnamneseViewer from "./anamneseViwer";
import ExamViewer from "./examViwer";

// Transition component for dialog animations
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

// Tema com cores para cada tipo de nota
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1852FE',
            light: '#ECF1FF',
        },
        note: {
            main: '#1852FE',  // Azul para notas
            light: '#ECF1FF',
            dark: '#0A3CC9',
            contrastText: '#FFFFFF',
            background: '#F0F5FF',
        },
        anamnese: {
            main: '#6366F1',  // Roxo para anamneses
            light: '#EDEDFF',
            dark: '#4338CA',
            contrastText: '#FFFFFF',
            background: '#F5F5FF',
        },
        receita: {
            main: '#22C55E',  // Verde para receitas
            light: '#ECFDF5',
            dark: '#16A34A',
            contrastText: '#FFFFFF',
            background: '#F0FFF4',
        },
        exame: {
            main: '#F59E0B',  // Amarelo para exames
            light: '#FEF9C3',
            dark: '#D97706',
            contrastText: '#FFFFFF',
            background: '#FFFBEB',
        },
        grey: {
            100: '#F6F7F9',
            200: '#EAECEF',
            300: '#DFE3EB',
            400: '#94A3B8',
            500: '#64748B',
            800: '#344054',
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
        }
    }
});

// Função para determinar o tipo de arquivo
const getFileTypeInfo = (fileName, fileType) => {
    if (!fileName) return { icon: <ArticleIcon />, color: "#94A3B8" };

    if (fileType && fileType.startsWith('image/') ||
        fileName.toLowerCase().endsWith('.jpg') ||
        fileName.toLowerCase().endsWith('.jpeg') ||
        fileName.toLowerCase().endsWith('.png') ||
        fileName.toLowerCase().endsWith('.gif')) {
        return { icon: <ImageIcon />, color: "#10B981" };
    }

    if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
        return { icon: <PictureAsPdfIcon />, color: "#EF4444" };
    }

    return { icon: <ArticleIcon />, color: "#3B82F6" };
};

const AllNotesViewDialog = ({
                                open,
                                onClose,
                                patientData,
                                notesData,
                                onEdit,
                                onDelete
                            }) => {
    const [activeFilter, setActiveFilter] = useState("todas");
    const [expanded, setExpanded] = useState({});
    const [filteredNotes, setFilteredNotes] = useState([]);
    const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState(null);

    const muiTheme = useTheme();
    const fullScreen = useMediaQuery(muiTheme.breakpoints.down('md'));
    const isSmall = useMediaQuery(muiTheme.breakpoints.down('sm'));

    // Métricas para badges
    const [metrics, setMetrics] = useState({
        notas: 0,
        anamneses: 0,
        receitas: 0,
        exames: 0 // Added exames metric
    });

    const getPatientName = () => {
        if (!patientData) return "Paciente";
        return patientData.nome || patientData.patientName || "Paciente";
    };

    // Aplicar filtros e calcular métricas
    useEffect(() => {
        if (!notesData) return;

        // Calcular métricas
        const notasCount = notesData.filter(nota =>
            nota.noteType !== "Anamnese" &&
            nota.noteType !== "Receita" &&
            nota.noteType !== "Exame").length;
        const anamnesesCount = notesData.filter(nota => nota.noteType === "Anamnese").length;
        const receitasCount = notesData.filter(nota => nota.noteType === "Receita").length;
        const examesCount = notesData.filter(nota => nota.noteType === "Exame").length;

        setMetrics({
            notas: notasCount,
            anamneses: anamnesesCount,
            receitas: receitasCount,
            exames: examesCount
        });

        // Aplicar filtros
        if (activeFilter === "todas") {
            setFilteredNotes(notesData);
        } else if (activeFilter === "notas") {
            setFilteredNotes(notesData.filter(nota =>
                nota.noteType !== "Anamnese" &&
                nota.noteType !== "Receita" &&
                nota.noteType !== "Exame"
            ));
        } else if (activeFilter === "anamneses") {
            setFilteredNotes(notesData.filter(nota => nota.noteType === "Anamnese"));
        } else if (activeFilter === "receitas") {
            setFilteredNotes(notesData.filter(nota => nota.noteType === "Receita"));
        } else if (activeFilter === "exames") {
            setFilteredNotes(notesData.filter(nota => nota.noteType === "Exame"));
        }

        // Reset current note index if filtered notes changed
        setCurrentNoteIndex(0);
    }, [notesData, activeFilter]);

    // Reset expanded state when dialog opens
    useEffect(() => {
        if (open) {
            setExpanded({});
            setCurrentNoteIndex(0);
        }
    }, [open]);

    // Handlers for filtering
    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
    };

    // Handler for toggling expansion
    const handleToggleExpand = (section) => {
        setExpanded(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Handlers for pagination
    const handleNextNote = () => {
        if (currentNoteIndex < filteredNotes.length - 1) {
            setCurrentNoteIndex(prev => prev + 1);
        }
    };

    const handlePrevNote = () => {
        if (currentNoteIndex > 0) {
            setCurrentNoteIndex(prev => prev - 1);
        }
    };

    // Handler for edit
    const handleEdit = (note) => {
        if (onEdit) {
            onEdit(note);
            onClose();
        }
    };

    // Handler for delete
    const handleDeleteClick = (note) => {
        setNoteToDelete(note);
        setDeleteConfirm(true);
    };

    const handleDeleteConfirm = () => {
        if (onDelete && noteToDelete) {
            onDelete(noteToDelete.id);
            setDeleteConfirm(false);
            setNoteToDelete(null);

            // Update filtered notes
            setFilteredNotes(prev => prev.filter(n => n.id !== noteToDelete.id));

            // Adjust current index if necessary
            if (currentNoteIndex >= filteredNotes.length - 1) {
                setCurrentNoteIndex(Math.max(0, filteredNotes.length - 2));
            }
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirm(false);
        setNoteToDelete(null);
    };

    // Cores por tipo de nota
    const getTypeColor = (type) => {
        switch(type) {
            case 'Anamnese':
                return theme.palette.anamnese;
            case 'Receita':
                return theme.palette.receita;
            case 'Exame':
                return theme.palette.exame;
            default:
                return theme.palette.note;
        }
    };

    // Ícone por tipo de nota
    const getTypeIcon = (type) => {
        switch(type) {
            case 'Anamnese':
                return <HistoryEduIcon />;
            case 'Receita':
                return <MedicationIcon />;
            case 'Exame':
                return <BiotechIcon />;
            case 'Consulta':
                return <EventNoteIcon />;
            default:
                return <AssignmentIcon />;
        }
    };

    // Formato do tipo de nota
    const getTypeLabel = (type) => {
        switch(type) {
            case 'Anamnese':
                return 'Anamnese';
            case 'Receita':
                return 'Receita Médica';
            case 'Exame':
                return 'Exame';
            case 'Consulta':
                return 'Nota de Consulta';
            case 'Rápida':
                return 'Nota Rápida';
            default:
                return 'Nota';
        }
    };

    // Formatação de data
    const formatDate = (date) => {
        if (!date) return "";
        const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
        return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    };

    const formatDateTime = (date) => {
        if (!date) return "";
        const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
        return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    };

    const formatTimeAgo = (date) => {
        if (!date) return "";
        const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
        return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });
    };

    // Get current note
    const currentNote = filteredNotes[currentNoteIndex];

    // Render functions for note content
    const renderNoteContent = (note) => {
        if (!note) return null;

        const typeColor = getTypeColor(note.noteType);

        return (
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: 2,
                    border: '1px solid #EAECEF',
                    mb: 3,
                    backgroundColor: 'white'
                }}
            >
                {/* Texto principal da nota */}
                {note.noteText && (
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                        {note.noteText}
                    </Typography>
                )}

                {/* Se for uma receita, mostra uma mensagem para ver o PDF */}
                {note.noteType === 'Receita' && note.pdfUrl && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            mt: 2,
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: typeColor.light,
                            border: `1px dashed ${typeColor.main}`
                        }}
                    >
                        <Button
                            variant="contained"
                            startIcon={<PictureAsPdfIcon />}
                            onClick={() => window.open(note.pdfUrl, '_blank')}
                            sx={{
                                backgroundColor: typeColor.main,
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: typeColor.dark
                                },
                                mb: 1
                            }}
                        >
                            Visualizar Receita Completa (PDF)
                        </Button>
                        <Typography variant="caption" color="textSecondary">
                            Clique para abrir a receita em formato PDF
                        </Typography>
                    </Box>
                )}

                {/* Se for uma anamnese, mostra uma mensagem para ver o PDF */}
                {note.noteType === 'Anamnese' && note.pdfUrl && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            mt: 2,
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: typeColor.light,
                            border: `1px dashed ${typeColor.main}`
                        }}
                    >
                        <Button
                            variant="contained"
                            startIcon={<PictureAsPdfIcon />}
                            onClick={() => window.open(note.pdfUrl, '_blank')}
                            sx={{
                                backgroundColor: typeColor.main,
                                color: 'white',
                                '&:hover': {
                                    backgroundColor: typeColor.dark
                                },
                                mb: 1
                            }}
                        >
                            Visualizar Anamnese Completa (PDF)
                        </Button>
                        <Typography variant="caption" color="textSecondary">
                            Clique para abrir a anamnese em formato PDF
                        </Typography>
                    </Box>
                )}
            </Paper>
        );
    };

    // Rendering da seção de medicamentos (para receitas)
    const renderMedicamentos = (note) => {
        if (!note.medicamentos && !note.medications) return null;

        const medicamentos = note.medicamentos || note.medications || [];
        const typeColor = getTypeColor(note.noteType);

        if (medicamentos.length === 0) return null;

        return (
            <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{
                    fontWeight: 600,
                    color: typeColor.main,
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2
                }}>
                    <MedicationIcon sx={{ mr: 1 }} />
                    Medicamentos
                </Typography>

                {medicamentos.map((med, index) => {
                    // Normalize dos dados com base no formato (pode variar um pouco entre tipos)
                    const nome = med.nome || med.medicationName || med.name || '';
                    const concentracao = med.concentracao || med.dosage || '';
                    const posologia = med.posologia || med.frequency || '';
                    const duracao = med.duracao || med.duration || '';
                    const quantidade = med.quantidade || med.quantity || '';
                    const observacao = med.observacao || med.observation || '';

                    return (
                        <Card key={index} sx={{
                            mb: 2,
                            border: `1px solid ${typeColor.light}`,
                            boxShadow: 'none',
                            backgroundColor: alpha(typeColor.light, 0.5),
                            borderRadius: 2
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.grey[800] }}>
                                            {nome}
                                            {concentracao && (
                                                <Typography component="span" sx={{ ml: 1, fontWeight: 500 }}>
                                                    {concentracao}
                                                </Typography>
                                            )}
                                        </Typography>

                                        {posologia && (
                                            <Typography variant="body1" sx={{ mt: 1, color: theme.palette.grey[700] }}>
                                                <strong>Posologia:</strong> {posologia}
                                            </Typography>
                                        )}

                                        <Grid container spacing={2} sx={{ mt: 1 }}>
                                            {quantidade && (
                                                <Grid item>
                                                    <Chip
                                                        label={`Quantidade: ${quantidade}`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: alpha(typeColor.light, 0.7),
                                                            borderRadius: '8px',
                                                            fontWeight: 500,
                                                            color: typeColor.dark
                                                        }}
                                                    />
                                                </Grid>
                                            )}

                                            {duracao && (
                                                <Grid item>
                                                    <Chip
                                                        label={`Duração: ${duracao}`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: alpha(typeColor.light, 0.7),
                                                            borderRadius: '8px',
                                                            fontWeight: 500,
                                                            color: typeColor.dark
                                                        }}
                                                    />
                                                </Grid>
                                            )}
                                        </Grid>

                                        {observacao && (
                                            <Typography variant="body2" sx={{
                                                mt: 2,
                                                color: theme.palette.grey[600],
                                                fontStyle: 'italic'
                                            }}>
                                                <strong>Observação:</strong> {observacao}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>
        );
    };

    // Rendering para detalhes da anamnese
    const renderAnamneseDetails = (note) => {
        if (note.noteType !== 'Anamnese' || !note) return null;

        const typeColor = getTypeColor(note.noteType);

        // Função para abrir o PDF da anamnese
        const handleOpenPdf = () => {
            if (note.pdfUrl) {
                window.open(note.pdfUrl, '_blank');
            }
        };

        return <AnamneseViewer anamneseData={note} typeColor={typeColor} onOpenPdf={handleOpenPdf} />;
    };

    // Rendering para detalhes do exame - NOVA FUNÇÃO
    const renderExameDetails = (note) => {
        if (note.noteType !== 'Exame' || !note) return null;

        const typeColor = getTypeColor(note.noteType);

        // Função para abrir anexos
        const handleOpenFile = (attachment) => {
            if (attachment.fileUrl) {
                window.open(attachment.fileUrl, '_blank');
            }
        };

        return <ExamViewer examData={note} typeColor={typeColor} onOpenFile={handleOpenFile} />;
    };

    // Rendering para informações de receita
    const renderReceitaDetails = (note) => {
        if (note.noteType !== 'Receita' || !note) return null;

        const typeColor = getTypeColor(note.noteType);
        const tipoReceita = note.tipo ? note.tipo.charAt(0).toUpperCase() + note.tipo.slice(1) : 'Comum';
        const uso = note.uso ? note.uso.charAt(0).toUpperCase() + note.uso.slice(1) : 'Interno';

        return (
            <Box sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                backgroundColor: alpha(typeColor.light, 0.5),
                                borderRadius: 2,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}
                        >
                            <Typography variant="body2" color="textSecondary">Tipo de Receita</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: typeColor.main, mt: 0.5 }}>
                                {tipoReceita}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                backgroundColor: alpha(typeColor.light, 0.5),
                                borderRadius: 2,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}
                        >
                            <Typography variant="body2" color="textSecondary">Uso</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: typeColor.main, mt: 0.5 }}>
                                {uso}
                            </Typography>
                        </Paper>
                    </Grid>

                    {note.dataEmissao && (
                        <Grid item xs={12} sm={6}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    backgroundColor: alpha(typeColor.light, 0.5),
                                    borderRadius: 2,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center'
                                }}
                            >
                                <Typography variant="body2" color="textSecondary">Data de Emissão</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: typeColor.main, mt: 0.5 }}>
                                    {formatDate(note.dataEmissao)}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}

                    {note.dataValidade && (
                        <Grid item xs={12} sm={6}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    backgroundColor: alpha(typeColor.light, 0.5),
                                    borderRadius: 2,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center'
                                }}
                            >
                                <Typography variant="body2" color="textSecondary">Validade</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: typeColor.main, mt: 0.5 }}>
                                    {formatDate(note.dataValidade)}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}

                    {note.orientacaoGeral && (
                        <Grid item xs={12}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    backgroundColor: alpha(typeColor.light, 0.5),
                                    borderRadius: 2
                                }}
                            >
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Orientações Gerais
                                </Typography>
                                <Typography variant="body1">
                                    {note.orientacaoGeral}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </Box>
        );
    };

    // Rendering para anexos
    const renderAttachments = (note) => {
        if (!note.attachments || note.attachments.length === 0) return null;

        const typeColor = getTypeColor(note.noteType);

        return (
            <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{
                    fontWeight: 600,
                    color: theme.palette.grey[800],
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2
                }}>
                    <AttachFileIcon sx={{ mr: 1 }} />
                    Anexos ({note.attachments.length})
                </Typography>

                <Grid container spacing={2}>
                    {note.attachments.map((attachment, index) => {
                        const fileInfo = getFileTypeInfo(attachment.fileName, attachment.fileType);

                        return (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        border: '1px solid #EAECEF',
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            backgroundColor: alpha(typeColor.light, 0.3),
                                            borderColor: typeColor.light,
                                        }
                                    }}
                                    onClick={() => attachment.fileUrl && window.open(attachment.fileUrl, '_blank')}
                                >
                                    <Avatar
                                        sx={{
                                            bgcolor: alpha(fileInfo.color, 0.1),
                                            color: fileInfo.color,
                                            width: 40,
                                            height: 40,
                                            mr: 2
                                        }}
                                    >
                                        {fileInfo.icon}
                                    </Avatar>
                                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 500,
                                                color: theme.palette.grey[800],
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {attachment.fileName}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{ color: theme.palette.grey[500] }}
                                        >
                                            {attachment.fileSize} • {attachment.uploadedAt ? formatDateTime(attachment.uploadedAt) : 'Data desconhecida'}
                                        </Typography>
                                    </Box>
                                    {/* Fix for div inside p error - using component="span" */}
                                    <IconButton
                                        size="small"
                                        component="span"
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: theme.palette.primary.main
                                        }}
                                    >
                                        <LinkIcon fontSize="small" />
                                    </IconButton>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            </Box>
        );
    };

    // Function to render date with proper DOM structure to avoid nesting errors
    const DateDisplay = ({ icon, text, color, isConsultation }) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {React.cloneElement(icon, {
                sx: {
                    color: color || theme.palette.grey[400],
                    fontSize: 18,
                    mr: 1
                }
            })}
            <Typography
                variant="body2"
                component="span"
                sx={{
                    fontWeight: isConsultation ? 500 : 'normal',
                    color: color || 'text.secondary'
                }}
            >
                {text}
            </Typography>
        </Box>
    );

    return (
        <ThemeProvider theme={theme}>
            <Dialog
                open={open}
                onClose={onClose}
                fullWidth
                maxWidth="lg"
                fullScreen={fullScreen}
                TransitionComponent={Transition}
                PaperProps={{
                    sx: {
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0px 4px 30px rgba(0, 0, 0, 0.08)',
                        height: fullScreen ? '100%' : '90vh',
                        maxHeight: fullScreen ? '100%' : '90vh',
                        display: 'flex',
                        flexDirection: 'column'
                    }
                }}
            >
                {/* AppBar with title and filters */}
                <AppBar position="static" color="default" elevation={0} sx={{
                    backgroundColor: 'white',
                    borderBottom: '1px solid #EAECEF'
                }}>
                    <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
                        <Typography variant="h6" sx={{
                            fontWeight: 600,
                            flexGrow: isSmall ? 0 : 1,
                            mr: isSmall ? 2 : 0
                        }}>
                            Histórico de Anotações
                        </Typography>

                        {!isSmall && (
                            <Tabs
                                value={activeFilter}
                                onChange={(e, newValue) => handleFilterChange(newValue)}
                                sx={{
                                    flexGrow: 0,
                                    '& .MuiTabs-indicator': {
                                        backgroundColor: theme.palette.primary.main
                                    }
                                }}
                            >
                                <Tab
                                    value="todas"
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            Todas
                                            <Badge
                                                badgeContent={notesData?.length || 0}
                                                color="error"
                                                sx={{ ml: 1 }}
                                            />
                                        </Box>
                                    }
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 500
                                    }}
                                />
                                <Tab
                                    value="notas"
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            Notas
                                            <Badge
                                                badgeContent={metrics.notas}
                                                color="error"
                                                sx={{ ml: 1 }}
                                            />
                                        </Box>
                                    }
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 500
                                    }}
                                />
                                <Tab
                                    value="anamneses"
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            Anamneses
                                            <Badge
                                                badgeContent={metrics.anamneses}
                                                color="error"
                                                sx={{ ml: 1 }}
                                            />
                                        </Box>
                                    }
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 500
                                    }}
                                />
                                <Tab
                                    value="receitas"
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            Receitas
                                            <Badge
                                                badgeContent={metrics.receitas}
                                                color="error"
                                                sx={{ ml: 1 }}
                                            />
                                        </Box>
                                    }
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 500
                                    }}
                                />
                                {/* Nova Tab para Exames */}
                                <Tab
                                    value="exames"
                                    label={
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            Exames
                                            <Badge
                                                badgeContent={metrics.exames}
                                                color="error"
                                                sx={{ ml: 1 }}
                                            />
                                        </Box>
                                    }
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 500
                                    }}
                                />
                            </Tabs>
                        )}

                        {isSmall && (
                            <IconButton
                                onClick={onClose}
                                edge="end"
                                sx={{ marginLeft: 'auto' }}
                            >
                                <CloseIcon />
                            </IconButton>
                        )}

                        {!isSmall && (
                            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                                <Typography variant="body2" component="div" sx={{
                                    color: theme.palette.grey[600],
                                    mr: 2
                                }}>
                                    {filteredNotes.length > 0
                                        ? `${currentNoteIndex + 1} de ${filteredNotes.length}`
                                        : "Sem notas"
                                    }
                                </Typography>

                                <IconButton
                                    onClick={onClose}
                                    sx={{ color: theme.palette.grey[700] }}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                        )}
                    </Toolbar>

                    {/* Mobile Tabs */}
                    {isSmall && (
                        <Tabs
                            value={activeFilter}
                            onChange={(e, newValue) => handleFilterChange(newValue)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{
                                px: 2,
                                '& .MuiTabs-indicator': {
                                    backgroundColor: theme.palette.primary.main
                                }
                            }}
                        >
                            <Tab
                                value="todas"
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        Todas
                                        <Badge
                                            badgeContent={notesData?.length || 0}
                                            color="error"
                                            sx={{ ml: 1 }}
                                        />
                                    </Box>
                                }
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 500
                                }}
                            />
                            <Tab
                                value="notas"
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        Notas
                                        <Badge
                                            badgeContent={metrics.notas}
                                            color="error"
                                            sx={{ ml: 1 }}
                                        />
                                    </Box>
                                }
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 500
                                }}
                            />
                            <Tab
                                value="anamneses"
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        Anamneses
                                        <Badge
                                            badgeContent={metrics.anamneses}
                                            color="error"
                                            sx={{ ml: 1 }}
                                        />
                                    </Box>
                                }
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 500
                                }}
                            />
                            <Tab
                                value="receitas"
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        Receitas
                                        <Badge
                                            badgeContent={metrics.receitas}
                                            color="error"
                                            sx={{ ml: 1 }}
                                        />
                                    </Box>
                                }
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 500
                                }}
                            />
                            {/* Nova Tab para Exames em mobile */}
                            <Tab
                                value="exames"
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        Exames
                                        <Badge
                                            badgeContent={metrics.exames}
                                            color="error"
                                            sx={{ ml: 1 }}
                                        />
                                    </Box>
                                }
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 500
                                }}
                            />
                        </Tabs>
                    )}
                </AppBar>

                {/* Navigation Buttons for Mobile */}
                {isSmall && filteredNotes.length > 0 && (
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1.5,
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        borderBottom: '1px solid #EAECEF'
                    }}>
                        <Button
                            startIcon={<KeyboardArrowLeftIcon />}
                            onClick={handlePrevNote}
                            disabled={currentNoteIndex === 0}
                            variant="text"
                            sx={{ color: theme.palette.grey[700] }}
                        >
                            Anterior
                        </Button>

                        <Typography variant="body2" component="div" sx={{
                            color: theme.palette.grey[600],
                        }}>
                            {filteredNotes.length > 0
                                ? `${currentNoteIndex + 1} de ${filteredNotes.length}`
                                : "Sem notas"
                            }
                        </Typography>

                        <Button
                            endIcon={<KeyboardArrowRightIcon />}
                            onClick={handleNextNote}
                            disabled={currentNoteIndex >= filteredNotes.length - 1}
                            variant="text"
                            sx={{ color: theme.palette.grey[700] }}
                        >
                            Próxima
                        </Button>
                    </Box>
                )}

                {/* Main Content Area */}
                <DialogContent sx={{
                    p: 0,
                    display: 'flex',
                    flexGrow: 1,
                    overflow: 'hidden'
                }}>
                    {filteredNotes.length === 0 ? (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            p: 4,
                            backgroundColor: theme.palette.grey[100]
                        }}>
                            <NotesIcon sx={{ fontSize: 60, color: theme.palette.grey[400], mb: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                Nenhuma nota encontrada
                            </Typography>
                            <Typography variant="body1" sx={{ color: theme.palette.grey[600], textAlign: 'center', mb: 3 }}>
                                Não há notas disponíveis para o filtro selecionado.
                            </Typography>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={() => handleFilterChange('todas')}
                            >
                                Ver todas as notas
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{
                            display: 'flex',
                            width: '100%',
                            height: '100%'
                        }}>
                            {/* Left Side - Notes List on bigger screens */}
                            {!isSmall && (
                                <Box sx={{
                                    width: '300px',
                                    height: '100%',
                                    borderRight: '1px solid #EAECEF',
                                    overflow: 'auto',
                                    backgroundColor: theme.palette.grey[100]
                                }}>
                                    {filteredNotes.map((note, index) => {
                                        const isActive = index === currentNoteIndex;
                                        const typeColor = getTypeColor(note.noteType);

                                        return (
                                            <Box
                                                key={note.id}
                                                sx={{
                                                    p: 2,
                                                    borderBottom: '1px solid #EAECEF',
                                                    cursor: 'pointer',
                                                    backgroundColor: isActive ? alpha(typeColor.light, 0.5) : 'white',
                                                    borderLeft: isActive ? `4px solid ${typeColor.main}` : '4px solid transparent',
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        backgroundColor: isActive ? alpha(typeColor.light, 0.5) : alpha(theme.palette.grey[100], 0.7)
                                                    }
                                                }}
                                                onClick={() => setCurrentNoteIndex(index)}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <Avatar
                                                        sx={{
                                                            width: 28,
                                                            height: 28,
                                                            bgcolor: typeColor.main,
                                                            color: 'white',
                                                            fontSize: 16,
                                                            mr: 1
                                                        }}
                                                    >
                                                        {getTypeIcon(note.noteType)}
                                                    </Avatar>
                                                    <Typography variant="body1" sx={{
                                                        fontWeight: 600,
                                                        color: isActive ? typeColor.main : theme.palette.grey[800],
                                                        flexGrow: 1,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {note.noteTitle || note.titulo || note.title || `${getTypeLabel(note.noteType)} - ${formatDate(note.createdAt)}`}
                                                    </Typography>
                                                </Box>

                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        color: theme.palette.grey[600],
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: 'vertical',
                                                        lineHeight: 1.4,
                                                        mb: 1,
                                                        ml: 0.5
                                                    }}
                                                >
                                                    {note.noteText || note.observations || "Sem descrição"}
                                                </Typography>

                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Chip
                                                        label={getTypeLabel(note.noteType)}
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: typeColor.light,
                                                            color: typeColor.main,
                                                            height: 24,
                                                            fontSize: 11,
                                                            fontWeight: 600
                                                        }}
                                                    />

                                                    <Typography variant="caption" sx={{ color: theme.palette.grey[500] }}>
                                                        {formatDateTime(note.createdAt).split(' às')[0]}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            )}

                            {/* Right Side - Note Content */}
                            <Box sx={{
                                flexGrow: 1,
                                height: '100%',
                                overflow: 'auto',
                                backgroundColor: isSmall ? 'white' : theme.palette.grey[50],
                                p: { xs: 2, sm: 3 }
                            }}>
                                {currentNote && (
                                    <>
                                        {/* Note Header */}
                                        <Box sx={{
                                            display: 'flex',
                                            flexDirection: { xs: 'column', sm: 'row' },
                                            alignItems: { xs: 'flex-start', sm: 'center' },
                                            justifyContent: 'space-between',
                                            mb: 3
                                        }}>
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <Avatar
                                                        sx={{
                                                            bgcolor: getTypeColor(currentNote.noteType).main,
                                                            color: 'white',
                                                            width: 36,
                                                            height: 36,
                                                            mr: 1.5
                                                        }}
                                                    >
                                                        {getTypeIcon(currentNote.noteType)}
                                                    </Avatar>
                                                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                                                        {currentNote.noteTitle || currentNote.titulo || currentNote.title || `${getTypeLabel(currentNote.noteType)} - ${formatDate(currentNote.createdAt)}`}
                                                    </Typography>
                                                    <Chip
                                                        label={getTypeLabel(currentNote.noteType)}
                                                        size="small"
                                                        sx={{
                                                            ml: 1.5,
                                                            bgcolor: getTypeColor(currentNote.noteType).main,
                                                            color: 'white',
                                                            fontWeight: 600,
                                                            fontSize: '11px',
                                                            height: '22px'
                                                        }}
                                                    />
                                                </Box>

                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    ml: { xs: 0, sm: 5 },
                                                    flexWrap: 'wrap',
                                                    gap: 2
                                                }}>
                                                    {/* Fix: Use the DateDisplay component to avoid DOM nesting errors */}
                                                    {currentNote.createdAt && (
                                                        <DateDisplay
                                                            icon={<CalendarTodayIcon />}
                                                            text={`Criado em: ${formatDateTime(currentNote.createdAt)}`}
                                                        />
                                                    )}

                                                    {currentNote.lastModified && (
                                                        <DateDisplay
                                                            icon={<AccessTimeIcon />}
                                                            text={`Atualizado: ${formatTimeAgo(currentNote.lastModified)}`}
                                                        />
                                                    )}

                                                    {(currentNote.consultationDate || currentNote.examDate) && (
                                                        <DateDisplay
                                                            icon={<EventNoteIcon />}
                                                            text={`${currentNote.noteType === 'Exame' ? 'Exame' : 'Consulta'}: ${formatDate(currentNote.consultationDate || currentNote.examDate)}`}
                                                            color={getTypeColor(currentNote.noteType).main}
                                                            isConsultation={true}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>

                                            {/* Note Actions */}
                                            <Box sx={{
                                                display: 'flex',
                                                mt: { xs: 2, sm: 0 },
                                                ml: { xs: 0, sm: 2 }
                                            }}>
                                                {!isSmall && (
                                                    <>
                                                        <Button
                                                            variant="outlined"
                                                            startIcon={<KeyboardArrowLeftIcon />}
                                                            onClick={handlePrevNote}
                                                            disabled={currentNoteIndex === 0}
                                                            sx={{ mr: 1 }}
                                                        >
                                                            Anterior
                                                        </Button>

                                                        <Button
                                                            variant="outlined"
                                                            endIcon={<KeyboardArrowRightIcon />}
                                                            onClick={handleNextNote}
                                                            disabled={currentNoteIndex >= filteredNotes.length - 1}
                                                            sx={{ mr: 2 }}
                                                        >
                                                            Próxima
                                                        </Button>
                                                    </>
                                                )}

                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    startIcon={<EditIcon />}
                                                    onClick={() => handleEdit(currentNote)}
                                                    sx={{
                                                        backgroundColor: getTypeColor(currentNote.noteType).main,
                                                        '&:hover': {
                                                            backgroundColor: getTypeColor(currentNote.noteType).dark
                                                        }
                                                    }}
                                                >
                                                    Editar
                                                </Button>
                                            </Box>
                                        </Box>

                                        <Divider sx={{ mb: 3 }} />

                                        {/* Note Content based on type */}
                                        {currentNote.noteType !== 'Anamnese' &&
                                            currentNote.noteType !== 'Exame' &&
                                            renderNoteContent(currentNote)}

                                        {/* Note Type Specific Content */}
                                        {currentNote.noteType === 'Receita' && renderReceitaDetails(currentNote)}
                                        {currentNote.noteType === 'Anamnese' && renderAnamneseDetails(currentNote)}
                                        {currentNote.noteType === 'Exame' && renderExameDetails(currentNote)}
                                        {renderMedicamentos(currentNote)}

                                        {/* Only show attachments for non-exam notes, as ExamViewer handles its own attachments */}
                                        {currentNote.noteType !== 'Exame' && renderAttachments(currentNote)}
                                    </>
                                )}
                            </Box>
                        </Box>
                    )}
                </DialogContent>

                {/* Footer Actions */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        p: { xs: 2, sm: 3 },
                        borderTop: '1px solid #EAECEF',
                        backgroundColor: 'white'
                    }}
                >
                    {deleteConfirm ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <WarningIcon sx={{ color: 'error.main', mr: 1.5 }} />
                            <Typography sx={{ color: 'error.main', fontWeight: 500, mr: 'auto' }}>
                                Tem certeza que deseja excluir esta nota?
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={handleDeleteCancel}
                                sx={{ mr: 1 }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={handleDeleteConfirm}
                            >
                                Excluir
                            </Button>
                        </Box>
                    ) : (
                        <>
                            {currentNote && (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteOutlineIcon />}
                                    onClick={() => handleDeleteClick(currentNote)}
                                    sx={{
                                        borderColor: theme.palette.error.main,
                                        color: theme.palette.error.main,
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.error.main, 0.04),
                                            borderColor: theme.palette.error.dark
                                        }
                                    }}
                                >
                                    Excluir
                                </Button>
                            )}

                            <Button
                                variant="outlined"
                                onClick={onClose}
                            >
                                Fechar
                            </Button>
                        </>
                    )}
                </Box>
            </Dialog>
        </ThemeProvider>
    );
};

export default AllNotesViewDialog;