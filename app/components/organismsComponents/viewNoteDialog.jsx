"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    Button,
    Chip,
    IconButton,
    Divider,
    Grid,
    Paper,
    Tooltip,
    Slide,
    Fade,
    Avatar,
    Card,
    CardContent,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    useTheme,
    useMediaQuery
} from "@mui/material";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

// Ícones
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import MedicationIcon from "@mui/icons-material/Medication";
import EventNoteIcon from "@mui/icons-material/EventNote";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import BiotechIcon from "@mui/icons-material/Biotech";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import ShareIcon from "@mui/icons-material/Share";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LinkIcon from "@mui/icons-material/Link";
import ImageIcon from "@mui/icons-material/Image";
import ArticleIcon from "@mui/icons-material/Article";
import WarningIcon from "@mui/icons-material/Warning";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import SpeedIcon from "@mui/icons-material/Speed";
import BubbleChartIcon from "@mui/icons-material/BubbleChart";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LabelIcon from "@mui/icons-material/Label";
import CategoryIcon from "@mui/icons-material/Category";

import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Serviço Firebase
import FirebaseService from "../../../lib/firebaseService";
import AnamneseViewer from "./anamneseViwer";

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
        // Novas cores para categorias
        categoria: {
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
        },
        MuiDivider: {
            styleOverrides: {
                root: {
                    margin: '16px 0',
                }
            }
        }
    }
});

// Transição para o Dialog
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
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

const ViewNoteDialog = ({
                            open,
                            onClose,
                            noteData,
                            noteType,
                            patientId,
                            doctorId,
                            onEdit,
                            onDelete
                        }) => {
    const [loading, setLoading] = useState(false);
    const [patientData, setPatientData] = useState(null);
    const [expanded, setExpanded] = useState({});
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    const muiTheme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

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

    // Cores por categoria de nota
    const getCategoryColor = (category) => {
        if (!category) return theme.palette.categoria.Geral;
        return theme.palette.categoria[category] || theme.palette.categoria.Geral;
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

    // Ícone por categoria
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

    // Busca dados do paciente
    useEffect(() => {
        const fetchPatientData = async () => {
            if (open && patientId && doctorId) {
                setLoading(true);
                try {
                    const data = await FirebaseService.getPatient(doctorId, patientId);
                    setPatientData(data);
                } catch (error) {
                    console.error("Erro ao buscar dados do paciente:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchPatientData();
    }, [open, patientId, doctorId]);

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

    const getPatientName = () => {
        if (!patientData) return "Carregando...";
        return patientData.nome || patientData.patientName || "Paciente";
    };

    const handleToggleExpand = (section) => {
        setExpanded(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const handleOpenPdf = () => {
        if (noteData.pdfUrl) {
            window.open(noteData.pdfUrl, '_blank');
        }
    };

    // Função corrigida para abrir anexos
    const handleOpenAttachment = (attachment) => {
        if (attachment) {
            // Verificar se o anexo tem uma URL direta
            if (attachment.fileUrl) {
                window.open(attachment.fileUrl, '_blank');
                return;
            }

            // Para compatibilidade com diferentes formatos de dados
            if (attachment.url) {
                window.open(attachment.url, '_blank');
                return;
            }

            // Verificar se o anexo tem um downloadURL (formato alternativo)
            if (attachment.downloadURL) {
                window.open(attachment.downloadURL, '_blank');
                return;
            }

            // Se o anexo for salvo em outro formato
            if (attachment.file && attachment.file.url) {
                window.open(attachment.file.url, '_blank');
                return;
            }

            // Caso seja um objeto com referência a storage mas sem URL direta
            if (attachment.storagePath) {
                // Neste caso, seria necessário obter a URL do Storage
                // através do FirebaseService ou diretamente do firebase/storage
                console.log("Anexo precisa ser obtido do Storage:", attachment.storagePath);
                try {
                    // Exemplo de como obter a URL dinamicamente (ajustar conforme seu FirebaseService)
                    FirebaseService.getDownloadURLFromPath(attachment.storagePath)
                        .then(url => window.open(url, '_blank'))
                        .catch(error => {
                            console.error("Erro ao obter URL do anexo:", error);
                            alert("Não foi possível abrir este anexo. Tente novamente mais tarde.");
                        });
                } catch (error) {
                    console.error("Erro ao processar o anexo:", error);
                    alert("Não foi possível abrir este anexo. Tente novamente mais tarde.");
                }
                return;
            }

            console.error("Formato de anexo não reconhecido:", attachment);
            alert("Não foi possível abrir este anexo. Formato desconhecido.");
        } else {
            console.error("Tentativa de abrir anexo nulo ou indefinido");
            alert("Não foi possível abrir este anexo.");
        }
    };

    const handleEdit = () => {
        if (onEdit) {
            onEdit(noteData);
        }
    };

    const handleDeleteClick = () => {
        setDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (onDelete) {
            onDelete(noteData.id);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirm(false);
    };

    const typeColor = getTypeColor(noteType);
    const typeIcon = getTypeIcon(noteType);
    const typeLabel = getTypeLabel(noteType);

    // Get category theme properties
    const categoryColor = getCategoryColor(noteData?.category);
    const categoryIcon = getCategoryIcon(noteData?.category);

    // Rendering da seção de medicamentos (para receitas)
    const renderMedicamentos = () => {
        if (!noteData.medicamentos && !noteData.medications) return null;

        const medicamentos = noteData.medicamentos || noteData.medications || [];

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
    const renderAnamneseDetails = () => {
        if (noteType !== 'Anamnese' || !noteData) return null;

        return <AnamneseViewer anamneseData={noteData} typeColor={typeColor} onOpenPdf={handleOpenPdf} />;
    };

    // Rendering para informações de receita
    const renderReceitaDetails = () => {
        if (noteType !== 'Receita' || !noteData) return null;

        const tipoReceita = noteData.tipo ? noteData.tipo.charAt(0).toUpperCase() + noteData.tipo.slice(1) : 'Comum';
        const uso = noteData.uso ? noteData.uso.charAt(0).toUpperCase() + noteData.uso.slice(1) : 'Interno';

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

                    {noteData.dataEmissao && (
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
                                    {formatDate(noteData.dataEmissao)}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}

                    {noteData.dataValidade && (
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
                                    {formatDate(noteData.dataValidade)}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}

                    {noteData.orientacaoGeral && (
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
                                    {noteData.orientacaoGeral}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </Box>
        );
    };

    // Rendering para exibir a categoria da nota (para notas simples)
    const renderCategoryBanner = () => {
        if (noteType !== 'Rápida' && noteType !== 'Consulta') return null;
        if (!noteData.category) return null;

        return (
            <Box
                sx={{
                    mb: 3,
                    p: 2,
                    borderRadius: '12px',
                    backgroundColor: categoryColor.background,
                    border: `1px solid ${categoryColor.light}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                        sx={{
                            bgcolor: categoryColor.main,
                            color: 'white',
                            width: 40,
                            height: 40,
                            mr: 2,
                        }}
                    >
                        {categoryIcon}
                    </Avatar>
                    <Box>
                        <Typography sx={{ fontSize: '14px', color: categoryColor.dark, fontWeight: 600 }}>
                            CATEGORIA
                        </Typography>
                        <Typography sx={{ fontWeight: 600, color: categoryColor.dark, fontSize: '18px' }}>
                            {noteData.category}
                        </Typography>
                    </Box>
                </Box>
                <Chip
                    label={noteType === 'Consulta' ? 'Nota de Consulta' : 'Nota Rápida'}
                    size="small"
                    sx={{
                        bgcolor: 'white',
                        color: categoryColor.main,
                        fontWeight: 500,
                        border: `1px solid ${categoryColor.light}`,
                        '& .MuiChip-label': {
                            px: 1.5
                        }
                    }}
                />
            </Box>
        );
    };

    // Rendering para anexos
    const renderAttachments = () => {
        if (!noteData.attachments || noteData.attachments.length === 0) return null;

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
                    Anexos ({noteData.attachments.length})
                </Typography>

                <Grid container spacing={2}>
                    {noteData.attachments.map((attachment, index) => {
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
                                            backgroundColor: alpha(categoryColor.light, 0.3),
                                            borderColor: categoryColor.light,
                                        }
                                    }}
                                    onClick={() => handleOpenAttachment(attachment)}
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
                                    <Tooltip title="Abrir">
                                        <IconButton size="small">
                                            <LinkIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            </Box>
        );
    };

    if (!noteData) return null;

    // Determine o tema de cor com base no tipo e categoria
    const themeToUse = noteType === 'Rápida' || noteType === 'Consulta'
        ? categoryColor
        : typeColor;

    return (
        <ThemeProvider theme={theme}>
            <Dialog
                open={open}
                onClose={onClose}
                fullWidth
                maxWidth="md"
                fullScreen={fullScreen}
                TransitionComponent={Transition}
                PaperProps={{
                    sx: {
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0px 4px 30px rgba(0, 0, 0, 0.08)',
                        height: fullScreen ? '100%' : 'auto',
                        maxHeight: fullScreen ? '100%' : '90vh'
                    }
                }}
            >
                {/* Header Enhanced with Category when appropriate */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #EAECEF',
                        backgroundColor: themeToUse.light,
                        p: { xs: 2, sm: 3 }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                            sx={{
                                bgcolor: themeToUse.main,
                                color: 'white',
                                width: 40,
                                height: 40,
                                mr: 2,
                                display: { xs: 'none', sm: 'flex' }
                            }}
                        >
                            {noteType === 'Rápida' || noteType === 'Consulta' ? categoryIcon : typeIcon}
                        </Avatar>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: themeToUse.dark }}>
                                    {noteData.noteTitle || noteData.titulo || `${typeLabel} - ${formatDate(noteData.createdAt)}`}
                                </Typography>
                                <Chip
                                    label={noteType === 'Rápida' || noteType === 'Consulta' ? noteData.category : typeLabel}
                                    size="small"
                                    sx={{
                                        ml: 1,
                                        bgcolor: themeToUse.main,
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '11px',
                                        height: '22px'
                                    }}
                                    icon={
                                        <Box component="span" sx={{ '& > svg': { color: 'white !important', fontSize: '14px !important' } }}>
                                            {noteType === 'Rápida' || noteType === 'Consulta' ? categoryIcon : typeIcon}
                                        </Box>
                                    }
                                />
                            </Box>
                            <Typography variant="body2" color="textSecondary">
                                Paciente: {getPatientName()}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: theme.palette.grey[700] }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Body */}
                <DialogContent sx={{ p: 0 }}>
                    <Box
                        sx={{
                            height: '100%',
                            p: { xs: 2, sm: 3 },
                            overflow: 'auto',
                            backgroundColor: themeToUse.background
                        }}
                    >
                        {/* Metadados e Datas */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: 2,
                                mb: 3,
                                p: 2,
                                borderRadius: 2,
                                backgroundColor: 'white',
                                border: '1px solid #EAECEF'
                            }}
                        >
                            {noteData.createdAt && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CalendarTodayIcon sx={{ color: theme.palette.grey[400], fontSize: 18, mr: 1 }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Criado em: {formatDateTime(noteData.createdAt)}
                                    </Typography>
                                </Box>
                            )}

                            {noteData.lastModified && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <AccessTimeIcon sx={{ color: theme.palette.grey[400], fontSize: 18, mr: 1 }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Atualizado: {formatTimeAgo(noteData.lastModified)}
                                    </Typography>
                                </Box>
                            )}

                            {noteData.consultationDate && (
                                <Box sx={{ display: 'flex', alignItems: 'center', ml: { xs: 0, sm: 'auto' } }}>
                                    <EventNoteIcon sx={{ color: themeToUse.main, fontSize: 18, mr: 1 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: themeToUse.main }}>
                                        Consulta: {formatDate(noteData.consultationDate)}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Category Banner for simple notes */}
                        {renderCategoryBanner()}

                        {/* Conteúdo principal */}
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
                            {noteData.noteText && (
                                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                                    {noteData.noteText}
                                </Typography>
                            )}

                            {/* Se for uma receita, mostra uma mensagem para ver o PDF */}
                            {noteType === 'Receita' && noteData.pdfUrl && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        mt: 2,
                                        p: 2,
                                        borderRadius: 2,
                                        backgroundColor: themeToUse.light,
                                        border: `1px dashed ${themeToUse.main}`
                                    }}
                                >
                                    <Button
                                        variant="contained"
                                        startIcon={<PictureAsPdfIcon />}
                                        onClick={handleOpenPdf}
                                        sx={{
                                            backgroundColor: themeToUse.main,
                                            color: 'white',
                                            '&:hover': {
                                                backgroundColor: themeToUse.dark
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
                            {noteType === 'Anamnese' && noteData.pdfUrl && (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        mt: 2,
                                        p: 2,
                                        borderRadius: 2,
                                        backgroundColor: themeToUse.light,
                                        border: `1px dashed ${themeToUse.main}`
                                    }}
                                >
                                    <Button
                                        variant="contained"
                                        startIcon={<PictureAsPdfIcon />}
                                        onClick={handleOpenPdf}
                                        sx={{
                                            backgroundColor: themeToUse.main,
                                            color: 'white',
                                            '&:hover': {
                                                backgroundColor: themeToUse.dark
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

                        {/* Detalhes específicos do tipo de nota */}
                        {noteType === 'Receita' && renderReceitaDetails()}
                        {noteType === 'Anamnese' && renderAnamneseDetails()}
                        {renderMedicamentos()}
                        {renderAttachments()}
                    </Box>
                </DialogContent>

                {/* Footer */}
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
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteOutlineIcon />}
                                onClick={handleDeleteClick}
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

                            <Box>
                                {noteData.pdfUrl && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<PictureAsPdfIcon />}
                                        onClick={handleOpenPdf}
                                        sx={{ mr: 2 }}
                                    >
                                        Ver PDF
                                    </Button>
                                )}

                                <Button
                                    variant="contained"
                                    startIcon={<EditIcon />}
                                    onClick={handleEdit}
                                    sx={{
                                        backgroundColor: themeToUse.main,
                                        color: 'white',
                                        '&:hover': {
                                            backgroundColor: themeToUse.dark
                                        }
                                    }}
                                >
                                    Editar
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Dialog>
        </ThemeProvider>
    );
};

export default ViewNoteDialog;