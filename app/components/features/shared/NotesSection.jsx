"use client";
import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Card,
    Button,
    IconButton,
    Chip,
    CircularProgress,
    Skeleton,
    Tooltip,
    Fade,
    ButtonGroup,
    Badge,
    Divider,
    CardContent,
    useTheme,
    useMediaQuery,
    TextField,
    InputAdornment,
    Tabs,
    Tab
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import FileIcon from "@mui/icons-material/InsertDriveFile";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import NotesIcon from "@mui/icons-material/Notes";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ViewListIcon from "@mui/icons-material/ViewList";
import BiotechIcon from "@mui/icons-material/Biotech";
import SearchIcon from "@mui/icons-material/Search";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { patientsService, notesService } from '@/lib/services/api';
import { useAuth } from '../../providers/authProvider';
import QuickDocumentsSection from "./QuickDocumentsSection";
import AnamneseDialog from "../dialogs/AnamneseDialog";
import ViewNoteDialog from "../dialogs/ViewNoteDialog";
import ReceitaDialog from "../dialogs/ReceitasDialog";
import PatientNoteDialog from "../dialogs/NovaNotaDialog";
import AllNotesViewDialog from "../dialogs/AllNotesDialog";
import ExamDialog from "../dialogs/ExamDialog";

// Theme colors
const themeColors = {
    primary: "#1852FE",
    primaryLight: "#E9EFFF",
    primaryDark: "#0A3AA8",
    textPrimary: "#111E5A",
    textSecondary: "#666",
    borderColor: "rgba(0, 0, 0, 0.10)",
    bgLight: "#F4F7FD",
    success: "#10B981",
    warning: "#FBBF24",
    error: "#EF4444",
    anamnese: "#6366F1",
    receita: "#22C55E",
    exame: "#F59E0B", // Nova cor para exames
};

// Action button component
function ActionButton({ onClick, disabled, color, startIcon, children, variant = "contained", sx = {} }) {
    return (
        <Button
            variant={variant}
            startIcon={startIcon}
            onClick={onClick}
            disabled={disabled}
            sx={{
                height: 44,
                padding: "0 20px",
                borderRadius: "99px",
                backgroundColor: variant === "contained" ? color : "transparent",
                color: variant === "contained" ? "#FFF" : color,
                fontFamily: "Gellix",
                fontSize: 14,
                fontWeight: 500,
                textTransform: "none",
                borderColor: variant === "outlined" ? color : "transparent",
                "&:hover": {
                    backgroundColor: variant === "contained" ? `${color}DD` : `${color}10`,
                    borderColor: variant === "outlined" ? color : "transparent",
                },
                "&.Mui-disabled": {
                    backgroundColor: variant === "contained" ? "#A0AEC0" : "transparent",
                    color: variant === "contained" ? "#FFF" : "#A0AEC0",
                    borderColor: variant === "outlined" ? "#A0AEC0" : "transparent",
                },
                ...sx
            }}
        >
            {children}
        </Button>
    );
}

// Note card component
function NotaCard({ nota, onOpen, isMobile, isTablet }) {
    // Check if it's an anamnese note, prescription or exam
    const isAnamneseNote = nota.noteType === "Anamnese";
    const isReceitaNote = nota.noteType === "Receita";
    const isExameNote = nota.noteType === "Exame";

    // Format date
    const formatDate = (date) => {
        if (!date) return "";
        const dateObj = date instanceof Date ? date : date.toDate();
        return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
    };

    // Get created text
    const getCreatedText = (date) => {
        if (!date) return "";
        return `Criado em ${formatDate(date)}`;
    };

    // Functions to render specific icons by file type
    const getFileIcon = (fileType) => {
        if (!fileType) return <FileIcon fontSize="small" />;
        if (fileType.startsWith('image/')) return <ImageIcon fontSize="small" sx={{ color: "#10B981" }} />;
        if (fileType.includes('pdf')) return <PictureAsPdfIcon fontSize="small" sx={{ color: "#EF4444" }} />;
        return <FileIcon fontSize="small" sx={{color: "#3B82F6" }} />;
    };

    // Determine the file type to display the correct icon
    const getFileType = (fileName) => {
        if (!fileName) return "application/octet-stream";
        if (fileName.endsWith('.pdf')) return "application/pdf";
        if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')) return "image/jpeg";
        return "application/octet-stream";
    };

    // Get card border color and styles based on note type
    const getCardStyle = () => {
        if (isAnamneseNote) {
            return {
                border: `1px solid ${themeColors.anamnese}`,
                boxShadow: "0px 2px 4px rgba(99, 102, 241, 0.15)",
                background: "linear-gradient(180deg, rgba(99, 102, 241, 0.05) 0%, rgba(255, 255, 255, 0) 100%)",
                hoverBoxShadow: "0px 4px 10px rgba(99, 102, 241, 0.2)",
                hoverBorderColor: themeColors.anamnese
            };
        } else if (isReceitaNote) {
            return {
                border: `1px solid ${themeColors.receita}`,
                boxShadow: "0px 2px 4px rgba(34, 197, 94, 0.15)",
                background: "linear-gradient(180deg, rgba(34, 197, 94, 0.05) 0%, rgba(255, 255, 255, 0) 100%)",
                hoverBoxShadow: "0px 4px 10px rgba(34, 197, 94, 0.2)",
                hoverBorderColor: themeColors.receita
            };
        } else if (isExameNote) {
            return {
                border: `1px solid ${themeColors.exame}`,
                boxShadow: "0px 2px 4px rgba(245, 158, 11, 0.15)",
                background: "linear-gradient(180deg, rgba(245, 158, 11, 0.05) 0%, rgba(255, 255, 255, 0) 100%)",
                hoverBoxShadow: "0px 4px 10px rgba(245, 158, 11, 0.2)",
                hoverBorderColor: themeColors.exame
            };
        } else {
            return {
                border: "1px solid #EAECEF",
                boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.04)",
                background: "none",
                hoverBoxShadow: "0px 3px 8px rgba(0, 0, 0, 0.08)",
                hoverBorderColor: "#D0D5DD"
            };
        }
    };

    // Get left column background color
    const getLeftColumnBgColor = () => {
        if (isAnamneseNote) return "rgba(99, 102, 241, 0.08)";
        if (isReceitaNote) return "rgba(34, 197, 94, 0.08)";
        if (isExameNote) return "rgba(245, 158, 11, 0.08)";
        return "#FBFCFD";
    };

    // Get right column background color
    const getRightColumnBgColor = () => {
        if (isAnamneseNote) return "rgba(99, 102, 241, 0.05)";
        if (isReceitaNote) return "rgba(34, 197, 94, 0.05)";
        if (isExameNote) return "rgba(245, 158, 11, 0.05)";
        return "#FBFCFD";
    };

    // Get note type color
    const getNoteTypeColor = () => {
        if (isAnamneseNote) return themeColors.anamnese;
        if (isReceitaNote) return themeColors.receita;
        if (isExameNote) return themeColors.exame;
        return nota.noteType === "Consulta" ? themeColors.success : themeColors.primary;
    };

    // Get title color
    const getTitleColor = () => {
        if (isAnamneseNote) return themeColors.anamnese;
        if (isReceitaNote) return themeColors.receita;
        if (isExameNote) return themeColors.exame;
        return "#111E5A";
    };

    // Get chip background color
    const getChipBgColor = () => {
        if (isAnamneseNote) return "rgba(99, 102, 241, 0.15)";
        if (isReceitaNote) return "rgba(34, 197, 94, 0.15)";
        if (isExameNote) return "rgba(245, 158, 11, 0.15)";
        return "#ECF1FF";
    };

    // Get more attachments box background color
    const getMoreAttachmentsBgColor = () => {
        if (isAnamneseNote) return "rgba(99, 102, 241, 0.1)";
        if (isReceitaNote) return "rgba(34, 197, 94, 0.1)";
        if (isExameNote) return "rgba(245, 158, 11, 0.1)";
        return "#ECF1FF";
    };

    const cardStyle = getCardStyle();

    return (
        <Card
            sx={{
                width: "100%",
                borderRadius: "12px",
                border: cardStyle.border,
                boxShadow: cardStyle.boxShadow,
                mb: 1.5,
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                position: "relative",
                background: cardStyle.background,
                "&:hover": {
                    boxShadow: cardStyle.hoverBoxShadow,
                    borderColor: cardStyle.hoverBorderColor,
                },
            }}
            onClick={() => onOpen(nota)}
        >
            <Box sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                width: "100%",
                p: 0,
                minHeight: isMobile ? "auto" : "72px"
            }}>
                {/* Left column - Consultation date */}
                <Box sx={{
                    width: isMobile ? "100%" : isTablet ? "120px" : "130px",
                    borderRight: isMobile ? "none" : "1px solid #EAECEF",
                    borderBottom: isMobile ? "1px solid #EAECEF" : "none",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    px: 2,
                    py: 1.5,
                    bgcolor: getLeftColumnBgColor()
                }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                        <FiberManualRecordIcon
                            sx={{
                                color: getNoteTypeColor(),
                                fontSize: 8,
                                mr: 0.75
                            }}
                        />
                        <Typography
                            variant="caption"
                            sx={{
                                color: getNoteTypeColor(),
                                fontFamily: "Gellix",
                                fontSize: 12,
                                fontWeight: 600
                            }}
                        >
                            {isAnamneseNote
                                ? "Anamnese:"
                                : isReceitaNote
                                    ? "Receita:"
                                    : isExameNote
                                        ? "Exame:"
                                        : nota.noteType === "Consulta" ? "Consulta:" : "Nota Rápida:"}
                        </Typography>
                    </Box>
                    <Typography
                        sx={{
                            color: "#111E5A",
                            fontFamily: "Gellix",
                            fontSize: 13,
                            fontWeight: 500,
                            ml: 1.75 // Aligned with the text above the icon
                        }}
                    >
                        {nota.consultationDate ? formatDate(nota.consultationDate) :
                            nota.examDate ? formatDate(nota.examDate) : formatDate(nota.createdAt)}
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            color: themeColors.textSecondary,
                            fontFamily: "Gellix",
                            fontSize: 11,
                            ml: 1.75,
                            mt: 0.5
                        }}
                    >
                        {getCreatedText(nota.createdAt)}
                    </Typography>
                </Box>

                {/* Center column - Main content */}
                <Box sx={{
                    flex: 1,
                    px: 2.5,
                    py: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    overflow: "hidden"
                }}>
                    {/* Title */}
                    <Typography
                        variant="h6"
                        sx={{
                            color: getTitleColor(),
                            fontFamily: "Gellix",
                            fontSize: 16,
                            fontWeight: 600,
                            mb: 0.75,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                        }}
                    >
                        {nota.noteTitle || nota.title}
                    </Typography>

                    {/* Content - Preview of text */}
                    <Typography
                        variant="body2"
                        sx={{
                            color: "#666",
                            fontFamily: "Gellix",
                            fontSize: 14,
                            lineHeight: 1.4,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                        }}
                    >
                        {nota.noteText || nota.observations}
                    </Typography>
                </Box>

                {/* Right column - Attachments */}
                {nota.attachments && nota.attachments.length > 0 && (
                    <Box sx={{
                        width: isMobile ? "100%" : isTablet ? "90px" : "100px",
                        borderLeft: isMobile ? "none" : "1px solid #EAECEF",
                        borderTop: isMobile ? "1px solid #EAECEF" : "none",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        p: 1.5,
                        bgcolor: getRightColumnBgColor(),
                    }}>
                        {/* Badge with number of attachments */}
                        <Chip
                            label={`${nota.attachments.length} anexo${nota.attachments.length > 1 ? 's' : ''}`}
                            size="small"
                            sx={{
                                backgroundColor: getChipBgColor(),
                                color: getNoteTypeColor(),
                                fontWeight: 500,
                                fontSize: 11,
                                mb: 1,
                                height: '22px',
                                borderRadius: "12px",
                            }}
                        />

                        {/* Icons of attachments */}
                        <Box sx={{ display: "flex", gap: 0.75, justifyContent: "center" }}>
                            {/* Show up to two attachments with icons */}
                            {nota.attachments.slice(0, 2).map((anexo, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: 32,
                                        height: 32,
                                        borderRadius: "4px",
                                        backgroundColor: "#F6F7F9",
                                        border: "1px solid #EAECEF",
                                    }}
                                >
                                    {getFileIcon(anexo.fileType || getFileType(anexo.fileName))}
                                </Box>
                            ))}

                            {/* Indicator for more attachments */}
                            {nota.attachments.length > 2 && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: 32,
                                        height: 32,
                                        borderRadius: "4px",
                                        backgroundColor: getMoreAttachmentsBgColor(),
                                        color: getNoteTypeColor(),
                                        fontWeight: 600,
                                        fontSize: 12
                                    }}
                                >
                                    +{nota.attachments.length - 2}
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Anamnesis Badge (if applicable) */}
            {isAnamneseNote && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        backgroundColor: themeColors.anamnese,
                        color: "white",
                        borderRadius: "0 12px 0 12px",
                        px: 1.5,
                        py: 0.3,
                        fontSize: 11,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <HistoryEduIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    ANAMNESE
                </Box>
            )}

            {/* Receita Badge (if applicable) */}
            {isReceitaNote && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        backgroundColor: themeColors.receita,
                        color: "white",
                        borderRadius: "0 12px 0 12px",
                        px: 1.5,
                        py: 0.3,
                        fontSize: 11,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <LocalPharmacyIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    RECEITA
                </Box>
            )}

            {/* Exame Badge (if applicable) */}
            {isExameNote && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        backgroundColor: themeColors.exame,
                        color: "white",
                        borderRadius: "0 12px 0 12px",
                        px: 1.5,
                        py: 0.3,
                        fontSize: 11,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <BiotechIcon sx={{ fontSize: 14, mr: 0.5 }} />
                    EXAME
                </Box>
            )}
        </Card>
    );
}

// Skeletons for loading
function NotaCardSkeleton() {
    return (
        <Card
            sx={{
                width: "100%",
                borderRadius: "16px",
                border: `1px solid ${themeColors.borderColor}`,
                boxShadow: "0px 4px 16px 0px rgba(0, 0, 0, 0.03)",
                mb: 1.5,
            }}
        >
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", width: "70%" }}>
                        <Skeleton variant="text" width={120} height={16} sx={{ mb: 0.5 }} />
                        <Skeleton variant="text" width="90%" height={24} sx={{ mb: 0.5 }} />
                        <Skeleton variant="text" width="100%" height={18} />
                        <Skeleton variant="text" width="80%" height={18} sx={{ mb: 0.5 }} />
                        <Skeleton variant="text" width={160} height={14} sx={{ mt: 0.5 }} />
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", width: "20%" }}>
                        <Skeleton variant="rounded" width={60} height={22} sx={{ mb: 1 }} />
                        <Skeleton variant="rounded" width={120} height={28} sx={{ mb: 0.5 }} />
                        <Skeleton variant="rounded" width={120} height={28} />
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

// Empty state redesenhado - mais elegante como no design de referência
function EmptyState({ onCreate }) {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 6,
                px: 3,
                backgroundColor: "rgba(244, 247, 253, 0.5)",
                borderRadius: "16px",
                border: `2px dashed rgba(24, 82, 254, 0.2)`,
                mt: 2,
                mb: 2,
                minHeight: "300px",
                position: "relative",
                overflow: "hidden",
                // Efeito de fundo sutil
                "&::before": {
                    content: '""',
                    position: "absolute",
                    top: "-50px",
                    right: "-50px",
                    width: "150px",
                    height: "150px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(24, 82, 254, 0.03)",
                    zIndex: 0
                },
                "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: "-30px",
                    left: "-30px",
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(24, 82, 254, 0.03)",
                    zIndex: 0
                }
            }}
        >
            {/* Ícone estilizado */}
            <Box
                sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "20px",
                    backgroundColor: "rgba(24, 82, 254, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 3,
                    zIndex: 1,
                    border: "2px solid rgba(24, 82, 254, 0.1)"
                }}
            >
                <NotesIcon sx={{ fontSize: 40, color: "rgba(24, 82, 254, 0.5)" }} />
            </Box>

            <Typography
                variant="h6"
                sx={{
                    fontFamily: "Gellix",
                    fontSize: 18,
                    fontWeight: 700,
                    color: themeColors.textPrimary,
                    mb: 1.5,
                    textAlign: "center",
                    zIndex: 1
                }}
            >
                Nenhuma anotação encontrada
            </Typography>

            <Typography
                variant="body2"
                sx={{
                    fontFamily: "Gellix",
                    fontSize: 14,
                    color: themeColors.textSecondary,
                    mb: 3,
                    textAlign: "center",
                    maxWidth: "400px",
                    lineHeight: 1.6,
                    zIndex: 1
                }}
            >
                Registre informações importantes sobre o paciente para acompanhar o progresso do tratamento e manter um histórico detalhado.
            </Typography>

            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onCreate}
                sx={{
                    height: 48,
                    px: 4,
                    borderRadius: "99px",
                    backgroundColor: themeColors.primary,
                    color: "#FFF",
                    fontFamily: "Gellix",
                    fontSize: 15,
                    fontWeight: 600,
                    textTransform: "none",
                    boxShadow: "0 4px 14px rgba(24, 82, 254, 0.25)",
                    zIndex: 1,
                    "&:hover": {
                        backgroundColor: themeColors.primaryDark,
                        boxShadow: "0 6px 20px rgba(24, 82, 254, 0.35)",
                        transform: "translateY(-2px)"
                    },
                    transition: "all 0.2s ease-in-out"
                }}
            >
                Nova nota
            </Button>
        </Box>
    );
}

// Main notes section component
export default function NotasSection({ notas = [], pacienteId, onNotaUpdated }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const isMedium = useMediaQuery(theme.breakpoints.down('md'));
    
    // Estados
    const [notasData, setNotasData] = useState([]);
    const [filteredNotas, setFilteredNotas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // States for dialog controls
    const [openNoteDialog, setOpenNoteDialog] = useState(false);
    const [openReceitaDialog, setOpenReceitaDialog] = useState(false);
    const [openAnamneseDialog, setOpenAnamneseDialog] = useState(false);
    const [openExameDialog, setOpenExameDialog] = useState(false); // Novo estado para o dialog de exames
    const [selectedNota, setSelectedNota] = useState(null);
    const [selectedReceita, setSelectedReceita] = useState(null);
    const [selectedExame, setSelectedExame] = useState(null); // Novo estado para exame selecionado
    const [openViewNoteDialog, setOpenViewNoteDialog] = useState(false);
    const [selectedAnamnese, setSelectedAnamnese] = useState(null);
    const [openAllNotesDialog, setOpenAllNotesDialog] = useState(false);

    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successAction, setSuccessAction] = useState("");
    const [patientData, setPatientData] = useState(null);

    // View filters
    const [activeFilter, setActiveFilter] = useState("todas");

    // Metrics for badges
    const [metrics, setMetrics] = useState({
        notas: 0,
        anamneses: 0,
        receitas: 0,
        exames: 0 // Nova métrica para exames
    });

    // Context
    const { user, getEffectiveUserId } = useAuth();

    // Effect to fetch patient data
    useEffect(() => {
        const effectiveUserId = getEffectiveUserId();
        if (pacienteId && effectiveUserId) {
            const fetchPatientData = async () => {
                try {
                    const data = await patientsService.getById(pacienteId);
                    setPatientData(data);
                } catch (error) {
                    console.error("Erro ao buscar dados do paciente:", error);
                }
            };

            fetchPatientData();
        }
    }, [pacienteId, user]);

    // Effect to load notes
    useEffect(() => {
        const effectiveUserId = getEffectiveUserId();
        if (pacienteId && effectiveUserId) {
            fetchNotas();
        }
    }, [pacienteId, getEffectiveUserId]);

    // Effect to apply filters
    useEffect(() => {
        applyFilters();
    }, [notasData, activeFilter]);

    // Function to fetch notes from Firebase
    const fetchNotas = async () => {
        try {
            setIsLoading(true);
            const notes = await notesService.listNotesByPatient(pacienteId);

            // Sort by creation date, newest first
            const sortedNotes = notes.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
                const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
                return dateB - dateA;
            });

            setNotasData(sortedNotes);
            calculateMetrics(sortedNotes);
        } catch (error) {
            console.error("Erro ao carregar notas:", error);
            setError("Não foi possível carregar as notas. Tente novamente mais tarde.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Quando as notas recebidas por props mudarem, atualize o estado local
        if (notas && notas.length > 0) {
            console.log("Recebendo novas notas via props:", notas.length);
            setNotasData(notas);
            setIsLoading(false);
        }
    }, [notas]);

    // Calculate metrics for badges
    const calculateMetrics = (notas) => {
        const notasCount = notas.filter(nota =>
            nota.noteType !== "Anamnese" &&
            nota.noteType !== "Receita" &&
            nota.noteType !== "Exame").length;
        const anamnesesCount = notas.filter(nota => nota.noteType === "Anamnese").length;
        const receitasCount = notas.filter(nota => nota.noteType === "Receita").length;
        const examesCount = notas.filter(nota => nota.noteType === "Exame").length;

        setMetrics({
            notas: notasCount,
            anamneses: anamnesesCount,
            receitas: receitasCount,
            exames: examesCount
        });
    };

    // Apply filters to notes
    const applyFilters = () => {
        if (activeFilter === "todas") {
            setFilteredNotas(notasData);
            return;
        }

        if (activeFilter === "notas") {
            setFilteredNotas(notasData.filter(nota =>
                nota.noteType !== "Anamnese" &&
                nota.noteType !== "Receita" &&
                nota.noteType !== "Exame"
            ));
            return;
        }

        if (activeFilter === "anamneses") {
            setFilteredNotas(notasData.filter(nota => nota.noteType === "Anamnese"));
            return;
        }

        if (activeFilter === "receitas") {
            setFilteredNotas(notasData.filter(nota => nota.noteType === "Receita"));
            return;
        }

        if (activeFilter === "exames") {
            setFilteredNotas(notasData.filter(nota => nota.noteType === "Exame"));
            return;
        }
    };

    // Function to open create note dialog
    const handleOpenCreateNoteDialog = () => {
        setSelectedNota(null);
        setOpenNoteDialog(true);
    };

    // Function to open create prescription dialog
    const handleOpenCreateReceitaDialog = () => {
        setSelectedReceita(null);
        setOpenReceitaDialog(true);
    };

    // Function to open create anamnese dialog
    const handleOpenCreateAnamneseDialog = () => {
        setOpenAnamneseDialog(true);
    };

    // Function to open create exam dialog
    const handleOpenCreateExameDialog = () => {
        setSelectedExame(null);
        setOpenExameDialog(true);
    };

    // Function to open all notes expanded dialog
    const handleOpenAllNotesDialog = () => {
        setOpenAllNotesDialog(true);
    };

    // Function to close all notes expanded dialog
    const handleCloseAllNotesDialog = () => {
        setOpenAllNotesDialog(false);
    };

    // Function to open existing note dialog
    const handleOpenNota = (nota) => {
        // Store selected note and open view dialog
        setSelectedNota(nota);
        setOpenViewNoteDialog(true);
    };

    const handleCloseViewNoteDialog = () => {
        setOpenViewNoteDialog(false);
        setSelectedNota(null);
    };

    const handleEditFromView = (nota) => {
        // Close view dialog
        setOpenViewNoteDialog(false);

        // Based on note type, open appropriate edit dialog
        if (nota.noteType === "Receita" && nota.prescriptionId) {
            // Open prescription dialog
            setSelectedReceita({
                id: nota.prescriptionId
            });
            setOpenReceitaDialog(true);
        } else if (nota.noteType === "Anamnese") {
            setOpenAnamneseDialog(true);
            // Pass the anamneseId from the note
            setSelectedAnamnese(nota.anamneseId);
        } else if (nota.noteType === "Exame" && nota.exameId) {
            // Open exam dialog
            setSelectedExame({
                id: nota.exameId
            });
            setOpenExameDialog(true);
        } else {
            // For regular notes, open standard note dialog
            setOpenNoteDialog(true);
        }
    };

    // Close dialogs
    const handleCloseNoteDialog = () => {
        setOpenNoteDialog(false);
        setSelectedNota(null);
    };

    const handleCloseReceitaDialog = async () => {
        setOpenReceitaDialog(false);
        setSelectedReceita(null);
        await fetchNotas();
    };

    const handleCloseAnamneseDialog = async () => {
        setOpenAnamneseDialog(false);
        await fetchNotas();
    };

    const handleCloseExameDialog = async () => {
        setOpenExameDialog(false);
        setSelectedExame(null);
        await fetchNotas();
    };

    // Handler to save or update note
    const handleSaveNote = async (notaData) => {
        try {
            if (selectedNota && selectedNota.id) {
                // If editing, update note in Firebase
                await notesService.updateNote(selectedNota.id, notaData);
                setSuccessAction("atualizada");
            } else {
                // If new note, create in Firebase
                await notesService.createNote(pacienteId, notaData);
                setSuccessAction("criada");
            }

            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);

            // Close dialog
            setOpenNoteDialog(false);

            // Reload updated notes list from Firebase
            await fetchNotas();

        } catch (error) {
            console.error("Erro ao salvar a nota:", error);
            // Optional: show error feedback
        }
    };

    // Handler to save prescription
    const handleSaveReceita = async (receitaId) => {
        try {

            // Show success message
            setSuccessAction("criada");
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);

            // Close prescription dialog
            setOpenReceitaDialog(false);
            setSelectedReceita(null);
            if (onNotaUpdated) {
                onNotaUpdated();
            } else {
                await fetchNotas();
            }
        } catch (error) {
            console.error("Erro ao salvar receita:", error);
        }
    };

    // Handler to save anamnese
    const handleSaveAnamnese = async (anamneseId) => {
        try {

            if (onNotaUpdated) {
                onNotaUpdated();
            } else {
                await fetchNotas();
            }
            setSuccessAction("criada");
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);
            setOpenAnamneseDialog(false);
        } catch (error) {
            console.error("Erro ao salvar anamnese:", error);
        }
    };

    // Handler to save exam
    const handleSaveExame = async (exameId) => {
        try {
            if (onNotaUpdated) {
                onNotaUpdated();
            } else {
                await fetchNotas();
            }
            setSuccessAction("criado");
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);
            setOpenExameDialog(false);
        } catch (error) {
            console.error("Erro ao salvar exame:", error);
        }
    };

    // Handler to delete note
    const handleDeleteNote = (noteId) => {
        // Remove note from local state
        setNotasData(prevNotas => prevNotas.filter(n => n.id !== noteId));

        // Show success message
        setSuccessAction("excluída");
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);

        // Close dialog
        setOpenNoteDialog(false);
        setOpenViewNoteDialog(false);

        // Update metrics
        calculateMetrics(notasData.filter(n => n.id !== noteId));
    };

    // Handler to delete exam
    const handleDeleteExame = (exameId) => {
        // Show success message
        setSuccessAction("excluído");
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);

        // Fetch updated notes
        fetchNotas();
    };

    // Update active filter
    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
    };

    // Define "Create new note" button text based on current filter
    const getActionButtonText = () => {
        switch (activeFilter) {
            case "notas":
                return "Nova nota";
            case "anamneses":
                return "Nova anamnese";
            case "receitas":
                return "Nova receita";
            case "exames":
                return "Novo exame";
            default:
                return "Nova nota";
        }
    };

    // Define primary action handler based on current filter
    const handlePrimaryAction = () => {
        switch (activeFilter) {
            case "notas":
                return handleOpenCreateNoteDialog();
            case "anamneses":
                return handleOpenCreateAnamneseDialog();
            case "receitas":
                return handleOpenCreateReceitaDialog();
            case "exames":
                return handleOpenCreateExameDialog();
            default:
                return handleOpenCreateNoteDialog();
        }
    };

    // Estado para busca
    const [searchQuery, setSearchQuery] = useState("");

    // Filtrar notas por busca
    const searchFilteredNotas = searchQuery
        ? filteredNotas.filter(nota =>
            (nota.noteTitle || nota.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (nota.noteText || nota.observations || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
        : filteredNotas;

    return (
        <Box sx={{ width: "100%", maxWidth: "100%" }}>
            {/* Header - igual à referência */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "flex-start" : "flex-end",
                    justifyContent: "space-between",
                    mb: 3,
                    gap: 2,
                }}
            >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                    <Typography
                        sx={{
                            fontFamily: "Gellix",
                            fontSize: isMobile ? 24 : 28,
                            fontWeight: 700,
                            color: themeColors.textPrimary,
                        }}
                    >
                        Anotações
                    </Typography>
                    <Typography
                        sx={{
                            fontFamily: "Gellix",
                            fontSize: 14,
                            color: "#64748B",
                        }}
                    >
                        Histórico de evoluções e registros do paciente
                    </Typography>
                </Box>

                {/* Botões de ação - seguindo o padrão da referência */}
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <Button
                        variant="outlined"
                        startIcon={<ViewListIcon sx={{ fontSize: 16 }} />}
                        onClick={handleOpenAllNotesDialog}
                        sx={{
                            height: 44,
                            px: 3,
                            gap: 1,
                            borderRadius: "8px",
                            borderColor: "#E2E8F0",
                            color: themeColors.textPrimary,
                            fontFamily: "Gellix",
                            fontSize: 14,
                            fontWeight: 500,
                            textTransform: "none",
                            display: isMobile ? "none" : "flex",
                            "&:hover": {
                                borderColor: themeColors.primary,
                                backgroundColor: "rgba(24, 82, 254, 0.04)",
                            },
                        }}
                    >
                        Ver tudo expandido
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<NoteAddIcon sx={{ fontSize: 16 }} />}
                        onClick={handlePrimaryAction}
                        sx={{
                            height: 44,
                            px: 3,
                            gap: 1,
                            borderRadius: "8px",
                            backgroundColor: themeColors.primary,
                            color: "#FFF",
                            fontFamily: "Gellix",
                            fontSize: 14,
                            fontWeight: 600,
                            textTransform: "none",
                            boxShadow: "0 8px 24px rgba(24, 82, 254, 0.25)",
                            "&:hover": {
                                backgroundColor: "#1E40AF",
                                boxShadow: "0 12px 32px rgba(24, 82, 254, 0.35)",
                            },
                        }}
                    >
                        {getActionButtonText()}
                    </Button>
                </Box>
            </Box>

            {/* Container principal com tabs e busca - PROPORÇÃO AUMENTADA */}
            <Card
                sx={{
                    borderRadius: "16px",
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    overflow: "hidden",
                    backgroundColor: "#fff",
                }}
            >
                {/* Área de filtros e busca - altura aumentada */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: isMobile ? "column" : "row",
                        alignItems: isMobile ? "stretch" : "center",
                        justifyContent: "space-between",
                        gap: 2,
                        p: 2,
                    }}
                >
                    {/* Tabs estilo pill - TAMANHO AUMENTADO */}
                    <Box
                        sx={{
                            display: "flex",
                            gap: 0.5,
                            p: 0.5,
                            backgroundColor: "rgba(241, 245, 249, 0.8)",
                            borderRadius: "8px",
                            flexWrap: isMobile ? "wrap" : "nowrap",
                        }}
                    >
                        {[
                            { value: "todas", label: "Todas" },
                            { value: "notas", label: "Notas" },
                            { value: "anamneses", label: "Anamneses" },
                            { value: "receitas", label: "Receitas" },
                            { value: "exames", label: "Exames" },
                        ].map((tab) => (
                            <Button
                                key={tab.value}
                                onClick={() => setActiveFilter(tab.value)}
                                sx={{
                                    px: 2.5,
                                    py: 1,
                                    borderRadius: "6px",
                                    fontFamily: "Gellix",
                                    fontSize: 13,
                                    fontWeight: 500,
                                    textTransform: "none",
                                    minWidth: "auto",
                                    backgroundColor: activeFilter === tab.value ? "#FFF" : "transparent",
                                    color: activeFilter === tab.value ? themeColors.textPrimary : "#64748B",
                                    boxShadow: activeFilter === tab.value ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                                    "&:hover": {
                                        backgroundColor: activeFilter === tab.value ? "#FFF" : "rgba(255,255,255,0.5)",
                                    },
                                }}
                            >
                                {tab.label}
                            </Button>
                        ))}
                    </Box>

                    {/* Campo de busca - TAMANHO AUMENTADO */}
                    <TextField
                        placeholder="Filtrar registros..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        size="small"
                        sx={{
                            width: isMobile ? "100%" : 280,
                            "& .MuiOutlinedInput-root": {
                                height: 44,
                                borderRadius: "8px",
                                backgroundColor: "#FFF",
                                fontFamily: "Gellix",
                                fontSize: 14,
                                "& fieldset": {
                                    borderColor: "rgba(0,0,0,0.12)",
                                },
                                "&:hover fieldset": {
                                    borderColor: "rgba(0,0,0,0.2)",
                                },
                                "&.Mui-focused fieldset": {
                                    borderColor: themeColors.primary,
                                },
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ fontSize: 20, color: "#64748B" }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                {/* Conteúdo - lista de notas ou empty state */}
                {isLoading ? (
                    <Box sx={{ p: 6, display: "flex", justifyContent: "center" }}>
                        <CircularProgress size={40} />
                    </Box>
                ) : searchFilteredNotas.length === 0 ? (
                    /* Empty state */
                    <Box
                        sx={{
                            p: isMobile ? 5 : 8,
                            minHeight: isMobile ? 280 : 340,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            gap: 2.5,
                            borderTop: "1px dashed rgba(0,0,0,0.08)",
                            backgroundColor: "rgba(248, 250, 252, 0.5)",
                            borderBottomLeftRadius: "16px",
                            borderBottomRightRadius: "16px",
                        }}
                    >
                        <Box
                            sx={{
                                width: 64,
                                height: 64,
                                borderRadius: "16px",
                                backgroundColor: "rgba(241, 245, 249, 1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <NoteAddIcon sx={{ fontSize: 32, color: "rgba(100, 116, 139, 0.5)" }} />
                        </Box>
                        <Box sx={{ maxWidth: 320, display: "flex", flexDirection: "column", gap: 1 }}>
                            <Typography
                                sx={{
                                    fontFamily: "Gellix",
                                    fontSize: 16,
                                    fontWeight: 600,
                                    color: themeColors.textPrimary,
                                }}
                            >
                                Nenhuma anotação encontrada
                            </Typography>
                            <Typography
                                sx={{
                                    fontFamily: "Gellix",
                                    fontSize: 14,
                                    color: "#64748B",
                                    lineHeight: 1.6,
                                }}
                            >
                                Registre informações importantes sobre o paciente para acompanhar o progresso do tratamento.
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            onClick={handlePrimaryAction}
                            sx={{
                                mt: 1.5,
                                height: 42,
                                px: 3,
                                borderRadius: "10px",
                                backgroundColor: themeColors.primary,
                                color: "#fff",
                                fontFamily: "Gellix",
                                fontSize: 14,
                                fontWeight: 600,
                                textTransform: "none",
                                boxShadow: "0 4px 12px rgba(24, 82, 254, 0.2)",
                                "&:hover": {
                                    backgroundColor: "#1E40AF",
                                    boxShadow: "0 6px 16px rgba(24, 82, 254, 0.3)",
                                },
                            }}
                        >
                            Criar primeira nota
                        </Button>
                    </Box>
                ) : (
                    /* Lista de notas */
                    <Box
                        sx={{
                            p: 2,
                            maxHeight: isMobile ? 380 : 480,
                            overflowY: "auto",
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.5,
                            borderTop: "1px solid rgba(0,0,0,0.06)",
                            backgroundColor: "rgba(248, 250, 252, 0.3)",
                        }}
                    >
                        {searchFilteredNotas.map((nota, index) => (
                            <NotaCard
                                key={nota.id || index}
                                nota={nota}
                                onOpen={handleOpenNota}
                                isMobile={isMobile}
                                isTablet={isTablet}
                            />
                        ))}
                    </Box>
                )}
            </Card>

            {/* Dialog to create/edit note */}
            {openNoteDialog && (
                <PatientNoteDialog
                    open={openNoteDialog}
                    onClose={handleCloseNoteDialog}
                    note={selectedNota}
                    patientId={pacienteId}
                    onSave={handleSaveNote}
                    onDelete={handleDeleteNote}
                />
            )}

            {/* Dialog to create/edit prescription */}
            {openReceitaDialog && (
                <ReceitaDialog
                    open={openReceitaDialog}
                    onClose={handleCloseReceitaDialog}
                    patientId={pacienteId}
                    doctorId={user?.uid}
                    receitaId={selectedReceita?.id}
                    onSave={handleSaveReceita}
                />
            )}

            {/* Dialog to create anamnese */}
            {openAnamneseDialog && (
                <AnamneseDialog
                    open={openAnamneseDialog}
                    onClose={handleCloseAnamneseDialog}
                    patientId={pacienteId}
                    doctorId={user?.uid}
                    anamneseId={selectedAnamnese}
                    onSave={handleSaveAnamnese}
                />
            )}

            {/* Dialog to create/edit exam */}
            {openExameDialog && (
                <ExamDialog
                    open={openExameDialog}
                    onClose={handleCloseExameDialog}
                    exam={selectedExame}
                    patientId={pacienteId}
                    onSave={handleSaveExame}
                    onDelete={handleDeleteExame}
                />
            )}

            {/* Dialog to view note */}
            {openViewNoteDialog && (
                <ViewNoteDialog
                    open={openViewNoteDialog}
                    onClose={handleCloseViewNoteDialog}
                    noteData={selectedNota}
                    noteType={selectedNota?.noteType}
                    patientId={pacienteId}
                    doctorId={user?.uid}
                    onEdit={handleEditFromView}
                    onDelete={handleDeleteNote}
                />
            )}

            {/* Dialog to view all notes expanded */}
            {openAllNotesDialog && (
                <AllNotesViewDialog
                    open={openAllNotesDialog}
                    onClose={handleCloseAllNotesDialog}
                    patientData={patientData}
                    notesData={notasData}
                    onEdit={handleEditFromView}
                    onDelete={handleDeleteNote}
                />
            )}
        </Box>
    );
}