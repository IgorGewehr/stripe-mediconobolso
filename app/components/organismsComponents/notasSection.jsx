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
    Divider, CardContent
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import FirebaseService from "../../../lib/firebaseService";
import { useAuth } from "../authProvider";
import QuickDocumentsSection from "./quickDocumentsSection";
import AnamneseDialog from "./anamneseDialog";
import ViewNoteDialog from "./viewNoteDialog";
import ReceitaDialog from "./receitasDialog";
import PatientNoteDialog from "./novaNotaDialog";
import AllNotesViewDialog from "./allNotesDialog";

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
};

// Action button component
function ActionButton({ onClick, disabled, color, startIcon, children, variant = "contained" }) {
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
                }
            }}
        >
            {children}
        </Button>
    );
}

// Note card component
function NotaCard({ nota, onOpen }) {
    // Check if it's an anamnese note
    const isAnamneseNote = nota.noteType === "Anamnese";

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

    return (
        <Card
            sx={{
                width: "100%",
                borderRadius: "12px",
                border: `1px solid ${isAnamneseNote ? themeColors.anamnese : "#EAECEF"}`,
                boxShadow: isAnamneseNote
                    ? "0px 2px 4px rgba(99, 102, 241, 0.15)"
                    : "0px 1px 3px rgba(0, 0, 0, 0.04)",
                mb: 1.5,
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                position: "relative",
                "&:hover": {
                    boxShadow: isAnamneseNote
                        ? "0px 4px 10px rgba(99, 102, 241, 0.2)"
                        : "0px 3px 8px rgba(0, 0, 0, 0.08)",
                    borderColor: isAnamneseNote ? themeColors.anamnese : "#D0D5DD",
                },
                ...(isAnamneseNote && {
                    background: "linear-gradient(180deg, rgba(99, 102, 241, 0.05) 0%, rgba(255, 255, 255, 0) 100%)",
                })
            }}
            onClick={() => onOpen(nota)}
        >
            <Box sx={{
                display: "flex",
                width: "100%",
                p: 0,
                minHeight: "72px"
            }}>
                {/* Left column - Consultation date */}
                <Box sx={{
                    width: "130px",
                    borderRight: "1px solid #EAECEF",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    px: 2,
                    py: 1.5,
                    bgcolor: isAnamneseNote ? "rgba(99, 102, 241, 0.08)" : "#FBFCFD"
                }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                        <FiberManualRecordIcon
                            sx={{
                                color: isAnamneseNote
                                    ? themeColors.anamnese
                                    : nota.noteType === "Consulta" ? themeColors.success : themeColors.primary,
                                fontSize: 8,
                                mr: 0.75
                            }}
                        />
                        <Typography
                            variant="caption"
                            sx={{
                                color: isAnamneseNote
                                    ? themeColors.anamnese
                                    : nota.noteType === "Consulta" ? themeColors.success : themeColors.primary,
                                fontFamily: "Gellix",
                                fontSize: 12,
                                fontWeight: 600
                            }}
                        >
                            {isAnamneseNote
                                ? "Anamnese:"
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
                        {nota.consultationDate ? formatDate(nota.consultationDate) : formatDate(nota.createdAt)}
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
                            color: isAnamneseNote ? themeColors.anamnese : "#111E5A",
                            fontFamily: "Gellix",
                            fontSize: 16,
                            fontWeight: 600,
                            mb: 0.75,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                        }}
                    >
                        {nota.noteTitle}
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
                        {nota.noteText}
                    </Typography>
                </Box>

                {/* Right column - Attachments */}
                {nota.attachments && nota.attachments.length > 0 && (
                    <Box sx={{
                        width: "100px",
                        borderLeft: "1px solid #EAECEF",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        p: 1.5,
                        bgcolor: isAnamneseNote ? "rgba(99, 102, 241, 0.05)" : "#FBFCFD",
                    }}>
                        {/* Badge with number of attachments */}
                        <Chip
                            label={`${nota.attachments.length} anexo${nota.attachments.length > 1 ? 's' : ''}`}
                            size="small"
                            sx={{
                                backgroundColor: isAnamneseNote ? "rgba(99, 102, 241, 0.15)" : "#ECF1FF",
                                color: isAnamneseNote ? themeColors.anamnese : themeColors.primary,
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
                                        backgroundColor: isAnamneseNote ? "rgba(99, 102, 241, 0.1)" : "#ECF1FF",
                                        color: isAnamneseNote ? themeColors.anamnese : themeColors.primary,
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

// Empty state, when no notes
function EmptyState({ onCreate }) {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 3, // Reduced to be more compact
                px: 2,
                backgroundColor: "#F8F9FA",
                borderRadius: "16px",
                border: `1px dashed ${themeColors.borderColor}`,
                mt: 1, // Reduced to be closer to the header
                mb: 1
            }}
        >
            <Box
                component="img"
                src="/receitas.svg"
                alt="Sem anotações"
                sx={{
                    width: 80, // Reduced size
                    height: 80, // Reduced size
                    mb: 2,
                    opacity: 0.8
                }}
            />
            <Typography
                variant="h6"
                sx={{
                    fontFamily: "Gellix",
                    fontSize: 16,
                    fontWeight: 600,
                    color: themeColors.textPrimary,
                    mb: 1,
                    textAlign: "center"
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
                    mb: 2,
                    textAlign: "center",
                    maxWidth: "380px"
                }}
            >
                Registre informações importantes sobre o paciente para acompanhar o progresso do tratamento e manter um histórico detalhado.
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
                <ActionButton
                    onClick={onCreate}
                    color={themeColors.primary}
                    startIcon={<AddIcon />}
                >
                    Nova nota
                </ActionButton>
            </Box>
        </Box>
    );
}

// Main notes section component
export default function NotasSection({ pacienteId }) {
    // States
    const [notasData, setNotasData] = useState([]);
    const [filteredNotas, setFilteredNotas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // States for dialog controls
    const [openNoteDialog, setOpenNoteDialog] = useState(false);
    const [openReceitaDialog, setOpenReceitaDialog] = useState(false);
    const [openAnamneseDialog, setOpenAnamneseDialog] = useState(false);
    const [selectedNota, setSelectedNota] = useState(null);
    const [selectedReceita, setSelectedReceita] = useState(null);
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
        receitas: 0
    });

    // Context
    const { user } = useAuth();

    // Effect to fetch patient data
    useEffect(() => {
        if (pacienteId && user?.uid) {
            const fetchPatientData = async () => {
                try {
                    const data = await FirebaseService.getPatient(user.uid, pacienteId);
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
        if (pacienteId && user?.uid) {
            fetchNotas();
        }
    }, [pacienteId, user]);

    // Effect to apply filters
    useEffect(() => {
        applyFilters();
    }, [notasData, activeFilter]);

    // Function to fetch notes from Firebase
    const fetchNotas = async () => {
        try {
            setIsLoading(true);
            const notes = await FirebaseService.listNotes(user.uid, pacienteId);

            // Sort by creation date, newest first
            const sortedNotes = notes.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
                const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
                return dateB - dateA;
            });

            setNotasData(sortedNotes);

            // Calculate metrics
            calculateMetrics(sortedNotes);

        } catch (error) {
            console.error("Erro ao carregar notas:", error);
            setError("Não foi possível carregar as notas. Tente novamente mais tarde.");
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate metrics for badges
    const calculateMetrics = (notas) => {
        const notasCount = notas.filter(nota => nota.noteType !== "Anamnese" && nota.noteType !== "Receita").length;
        const anamnesesCount = notas.filter(nota => nota.noteType === "Anamnese").length;
        const receitasCount = notas.filter(nota => nota.noteType === "Receita").length;

        setMetrics({
            notas: notasCount,
            anamneses: anamnesesCount,
            receitas: receitasCount
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
                nota.noteType !== "Anamnese" && nota.noteType !== "Receita"
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

    // Handler to save or update note
    const handleSaveNote = async (notaData) => {
        try {
            if (selectedNota && selectedNota.id) {
                // If editing, update note in Firebase
                await FirebaseService.updateNote(user.uid, pacienteId, selectedNota.id, notaData);
                setSuccessAction("atualizada");
            } else {
                // If new note, create in Firebase
                await FirebaseService.createNote(user.uid, pacienteId, notaData);
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
            // Update notes list with latest data from Firebase
            await fetchNotas();

            // Show success message
            setSuccessAction("criada");
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);

            // Close prescription dialog
            setOpenReceitaDialog(false);
            setSelectedReceita(null);
        } catch (error) {
            console.error("Erro ao salvar receita:", error);
            // Optional: show error feedback
        }
    };

    // Handler to save anamnese
    const handleSaveAnamnese = async (anamneseId) => {
        try {
            // Update notes list with latest data from Firebase
            await fetchNotas();

            // Show success message
            setSuccessAction("criada");
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);

            // Close anamnese dialog
            setOpenAnamneseDialog(false);
        } catch (error) {
            console.error("Erro ao salvar anamnese:", error);
            // Optional: show error feedback
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

        // Update metrics
        calculateMetrics(notasData.filter(n => n.id !== noteId));
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
            default:
                return handleOpenCreateNoteDialog();
        }
    };

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: "1000px",
                display: "flex",
                flexDirection: "column",
                height: "auto",
            }}
        >
            {/* Header: only title */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    mb: 2
                }}
            >
                <Typography
                    variant="h4"
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix",
                        fontSize: "30px",
                        fontWeight: 600,
                    }}
                >
                    Anotações
                </Typography>
            </Box>

            {/* Filters, View All and New Note buttons in one line */}
            <Box sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
                mt: 2
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FilterAltIcon sx={{ mr: 1, color: themeColors.primary, fontSize: 18 }} />
                    <Typography variant="body2" sx={{ color: themeColors.textSecondary, mr: 2, fontWeight: 500 }}>
                        Filtrar por:
                    </Typography>

                    <ButtonGroup
                        variant="outlined"
                        aria-label="Filtro de visualização"
                        sx={{
                            '& .MuiButton-root': {
                                borderColor: '#E2E8F0',
                                color: themeColors.textSecondary,
                                fontWeight: 500,
                                fontSize: '14px',
                                height: '36px',

                                '&.Mui-selected, &.active': {
                                    backgroundColor: themeColors.primary,
                                    color: '#fff',
                                    borderColor: themeColors.primary,
                                },

                                '&:first-of-type': {
                                    borderTopLeftRadius: '50px',
                                    borderBottomLeftRadius: '50px',
                                },
                                '&:last-of-type': {
                                    borderTopRightRadius: '50px',
                                    borderBottomRightRadius: '50px',
                                }
                            }
                        }}
                    >
                        <Button
                            onClick={() => handleFilterChange('todas')}
                            className={activeFilter === 'todas' ? 'active' : ''}
                            sx={{
                                backgroundColor: activeFilter === 'todas' ? themeColors.primary : 'transparent',
                                color: activeFilter === 'todas' ? '#fff' : themeColors.textSecondary,
                                '&:hover': {
                                    backgroundColor: activeFilter === 'todas' ? themeColors.primary : 'rgba(24, 82, 254, 0.04)',
                                }
                            }}
                        >
                            Todas
                            <Badge
                                badgeContent={notasData.length}
                                color="error"
                                sx={{
                                    ml: 1,
                                    '& .MuiBadge-badge': {
                                        fontSize: '0.6rem',
                                        minWidth: '18px',
                                        height: '18px',
                                    }
                                }}
                            />
                        </Button>
                        <Button
                            onClick={() => handleFilterChange('notas')}
                            className={activeFilter === 'notas' ? 'active' : ''}
                            sx={{
                                backgroundColor: activeFilter === 'notas' ? themeColors.primary : 'transparent',
                                color: activeFilter === 'notas' ? '#fff' : themeColors.textSecondary,
                                '&:hover': {
                                    backgroundColor: activeFilter === 'notas' ? themeColors.primary : 'rgba(24, 82, 254, 0.04)',
                                }
                            }}
                        >
                            Notas
                            <Badge
                                badgeContent={metrics.notas}
                                color="error"
                                sx={{
                                    ml: 1,
                                    '& .MuiBadge-badge': {
                                        fontSize: '0.6rem',
                                        minWidth: '18px',
                                        height: '18px',
                                    }
                                }}
                            />
                        </Button>
                        <Button
                            onClick={() => handleFilterChange('anamneses')}
                            className={activeFilter === 'anamneses' ? 'active' : ''}
                            sx={{
                                backgroundColor: activeFilter === 'anamneses' ? themeColors.primary : 'transparent',
                                color: activeFilter === 'anamneses' ? '#fff' : themeColors.textSecondary,
                                '&:hover': {
                                    backgroundColor: activeFilter === 'anamneses' ? themeColors.primary : 'rgba(24, 82, 254, 0.04)',
                                }
                            }}
                        >
                            Anamneses
                            <Badge
                                badgeContent={metrics.anamneses}
                                color="error"
                                sx={{
                                    ml: 1,
                                    '& .MuiBadge-badge': {
                                        fontSize: '0.6rem',
                                        minWidth: '18px',
                                        height: '18px',
                                    }
                                }}
                            />
                        </Button>
                        <Button
                            onClick={() => handleFilterChange('receitas')}
                            className={activeFilter === 'receitas' ? 'active' : ''}
                            sx={{
                                backgroundColor: activeFilter === 'receitas' ? themeColors.primary : 'transparent',
                                color: activeFilter === 'receitas' ? '#fff' : themeColors.textSecondary,
                                '&:hover': {
                                    backgroundColor: activeFilter === 'receitas' ? themeColors.primary : 'rgba(24, 82, 254, 0.04)',
                                }
                            }}
                        >
                            Receitas
                            <Badge
                                badgeContent={metrics.receitas}
                                color="error"
                                sx={{
                                    ml: 1,
                                    '& .MuiBadge-badge': {
                                        fontSize: '0.6rem',
                                        minWidth: '18px',
                                        height: '18px',
                                    }
                                }}
                            />
                        </Button>
                    </ButtonGroup>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    {/* View All Expanded button */}
                    <Button
                        variant="outlined"
                        startIcon={<ViewListIcon />}
                        onClick={handleOpenAllNotesDialog}
                        sx={{
                            height: 44,
                            padding: "0 20px",
                            borderRadius: "99px",
                            borderColor: themeColors.primary,
                            color: themeColors.primary,
                            fontFamily: "Gellix",
                            fontSize: 14,
                            fontWeight: 500,
                            textTransform: "none",
                            '&:hover': {
                                backgroundColor: `${themeColors.primaryLight}20`,
                                borderColor: themeColors.primary,
                            }
                        }}
                    >
                        Ver tudo expandido
                    </Button>

                    {/* Create New button */}
                    <ActionButton
                        onClick={handlePrimaryAction}
                        color={themeColors.primary}
                        startIcon={<AddIcon />}
                        disabled={isLoading}
                    >
                        {getActionButtonText()}
                    </ActionButton>
                </Box>
            </Box>

            {/* Success message */}
            <Fade in={showSuccessMessage}>
                <Box
                    sx={{
                        p: 1.5,
                        mb: 1.5,
                        backgroundColor: "#E6F7F0",
                        color: "#10B981",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        fontFamily: "Gellix",
                    }}
                >
                    <Box
                        component="img"
                        src="/checkmark.svg"
                        alt="Sucesso"
                        sx={{
                            width: 18,
                            height: 18,
                            mr: 1
                        }}
                    />
                    Nota {successAction} com sucesso!
                </Box>
            </Fade>

            {/* Notes list */}
            <Box
                sx={{
                    width: "100%",
                    maxHeight: "480px",
                    overflowY: "auto",
                    paddingRight: 1,
                    // Scrollbar styles
                    "&::-webkit-scrollbar": {
                        width: "5px",
                        borderRadius: "3px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "rgba(0,0,0,0.15)",
                        borderRadius: "3px",
                    },
                    "&::-webkit-scrollbar-track": {
                        backgroundColor: "rgba(0,0,0,0.03)",
                        borderRadius: "3px",
                    },
                }}
            >
                {isLoading ? (
                    // Loading skeletons
                    Array(3).fill().map((_, index) => (
                        <NotaCardSkeleton key={index} />
                    ))
                ) : error ? (
                    // Error message
                    <Box
                        sx={{
                            p: 2,
                            borderRadius: "12px",
                            backgroundColor: "#FEE2E2",
                            display: "flex",
                            alignItems: "center",
                            color: "#EF4444",
                            mt: 1
                        }}
                    >
                        <Box
                            component="img"
                            src="/error-icon.svg"
                            alt="Erro"
                            sx={{
                                width: 20,
                                height: 20,
                                mr: 1
                            }}
                        />
                        <Typography variant="body2">{error}</Typography>
                        <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            sx={{ ml: "auto", textTransform: "none", borderRadius: "20px", fontSize: 12 }}
                            onClick={() => fetchNotas()}
                        >
                            Tentar novamente
                        </Button>
                    </Box>
                ) : filteredNotas.length === 0 ? (
                    // Empty state - no notes
                    <EmptyState onCreate={handlePrimaryAction} />
                ) : (
                    // Notes list
                    filteredNotas.map((nota) => (
                        <NotaCard
                            key={nota.id}
                            nota={nota}
                            onOpen={handleOpenNota}
                        />
                    ))
                )}
            </Box>

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