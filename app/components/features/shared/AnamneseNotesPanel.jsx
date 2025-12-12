"use client";

import React, { useState, useEffect } from "react";
import {
    Drawer,
    Box,
    Typography,
    IconButton,
    Divider,
    Paper,
    Chip,
    Avatar,
    Badge,
    Tooltip,
    useTheme,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    alpha,
    AppBar,
    Toolbar,
    InputAdornment,
    TextField,
    useMediaQuery,
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    Slide
} from "@mui/material";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Ícones
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import MedicationIcon from "@mui/icons-material/Medication";
import EventNoteIcon from "@mui/icons-material/EventNote";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import AssignmentIcon from "@mui/icons-material/Assignment";
import NotesIcon from "@mui/icons-material/Notes";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import BiotechIcon from "@mui/icons-material/Biotech";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {ChevronRightIcon} from "lucide-react";

// Importar o AnamneseViewer
import AnamneseViewer from "./AnamneseViewer";

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
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderRadius: '20px 0 0 20px',
                    boxShadow: '0px 4px 30px rgba(0, 0, 0, 0.08)',
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

// Transição para o Drawer
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="left" ref={ref} {...props} />;
});

const AnamneseNotesPanel = ({
                                open,
                                onClose,
                                patientData,
                                notesData,
                                onSelectNote
                            }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("todas");
    const [filteredNotes, setFilteredNotes] = useState([]);
    const [expandedNotes, setExpandedNotes] = useState({});
    const [selectedNoteId, setSelectedNoteId] = useState(null);

    // Novos estados para visualização de anamnese
    const [viewingAnamneseDetail, setViewingAnamneseDetail] = useState(false);
    const [selectedAnamneseData, setSelectedAnamneseData] = useState(null);

    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
    const drawerWidth = isMobile ? '100%' : 450

    // Métricas para chips
    const [metrics, setMetrics] = useState({
        notas: 0,
        anamneses: 0,
        receitas: 0,
        exames: 0
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
            nota.noteType !== "Exame"
        ).length;

        const anamnesesCount = notesData.filter(nota => nota.noteType === "Anamnese").length;
        const receitasCount = notesData.filter(nota => nota.noteType === "Receita").length;
        const examesCount = notesData.filter(nota => nota.noteType === "Exame").length;

        setMetrics({
            notas: notasCount,
            anamneses: anamnesesCount,
            receitas: receitasCount,
            exames: examesCount
        });

        // Aplicar filtros e busca
        let filtered = [...notesData];

        // Aplicar filtro por tipo
        if (activeFilter === "notas") {
            filtered = filtered.filter(nota =>
                nota.noteType !== "Anamnese" &&
                nota.noteType !== "Receita" &&
                nota.noteType !== "Exame"
            );
        } else if (activeFilter === "anamneses") {
            filtered = filtered.filter(nota => nota.noteType === "Anamnese");
        } else if (activeFilter === "receitas") {
            filtered = filtered.filter(nota => nota.noteType === "Receita");
        } else if (activeFilter === "exames") {
            filtered = filtered.filter(nota => nota.noteType === "Exame");
        }

        // Aplicar busca
        if (searchTerm.trim() !== "") {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(
                nota =>
                    (nota.noteTitle && nota.noteTitle.toLowerCase().includes(search)) ||
                    (nota.noteText && nota.noteText.toLowerCase().includes(search)) ||
                    (nota.titulo && nota.titulo.toLowerCase().includes(search))
            );
        }

        // Ordenar por data, mais recentes primeiro
        filtered.sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        });

        setFilteredNotes(filtered);

        // Por padrão, expandir todas as notas
        const expansionState = {};
        filtered.forEach(note => {
            expansionState[note.id] = true;
        });
        setExpandedNotes(expansionState);
    }, [notesData, activeFilter, searchTerm]);

    // Reset when drawer opens
    useEffect(() => {
        if (open) {
            setSearchTerm("");
            setActiveFilter("todas");
            setViewingAnamneseDetail(false);
            setSelectedAnamneseData(null);
        }
    }, [open]);

    // Handlers para filtros
    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
    };

    // Handler para busca
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Handler para expansão de notas
    const handleToggleExpand = (noteId) => {
        setExpandedNotes(prev => ({
            ...prev,
            [noteId]: !prev[noteId]
        }));
    };

    // Função para abrir PDF
    const handleOpenPdf = () => {
        if (selectedAnamneseData && selectedAnamneseData.pdfUrl) {
            window.open(selectedAnamneseData.pdfUrl, '_blank');
        }
    };

    // Handler para seleção de nota
    const handleSelectNote = (note) => {
        setSelectedNoteId(note.id);

        // Se for uma anamnese, configura para visualização detalhada
        if (note.noteType === 'Anamnese') {
            setSelectedAnamneseData(note);
            setViewingAnamneseDetail(true);
        } else {
            setViewingAnamneseDetail(false);
        }

        if (onSelectNote) {
            onSelectNote(note);
        }
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

    const [collapsed, setCollapsed] = useState(false);

    const handleCollapsePanel = () => {
        setCollapsed(!collapsed);
    };

    // Formatação de data
    const formatDate = (date) => {
        if (!date) return "";
        const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
        return format(dateObj, "dd 'de' MMMM", { locale: ptBR });
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

    // Render note item
    const renderNoteItem = (note) => {
        const typeColor = getTypeColor(note.noteType);
        const isExpanded = expandedNotes[note.id];
        const isSelected = selectedNoteId === note.id;

        return (
            <Paper
                key={note.id}
                elevation={0}
                sx={{
                    mb: 2,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: isSelected ? `2px solid ${typeColor.main}` : '1px solid #EAECEF',
                    boxShadow: isSelected ? `0 0 0 1px ${typeColor.main}` : 'none',
                    backgroundColor: isSelected ? alpha(typeColor.light, 0.5) : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                        backgroundColor: alpha(typeColor.light, 0.3),
                        borderColor: typeColor.light,
                    }
                }}
            >
                {/* Cabeçalho da nota */}
                <Box
                    sx={{
                        p: 2.5, // Aumentado de p: 2
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: isExpanded ? '1px solid #EAECEF' : 'none',
                        backgroundColor: alpha(typeColor.light, 0.3),
                    }}
                    onClick={() => handleSelectNote(note)}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                            sx={{
                                width: 32,
                                height: 32,
                                bgcolor: typeColor.main,
                                color: 'white',
                                mr: 1.5
                            }}
                        >
                            {getTypeIcon(note.noteType)}
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: typeColor.dark, lineHeight: 1.2 }}>
                                {note.noteTitle || note.titulo || `${getTypeLabel(note.noteType)}`}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarTodayIcon sx={{ fontSize: 12, mr: 0.5 }} />
                                {formatDate(note.createdAt)}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleToggleExpand(note.id);
                        }}
                    >
                        {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </Box>

                {/* Conteúdo da nota (expandível) */}
                {isExpanded && (
                    <Box
                        sx={{
                            p: 2,
                            maxHeight: '280px',
                            overflowY: 'auto',
                        }}
                        onClick={() => handleSelectNote(note)}
                    >
                        {/* Texto da nota */}
                        {note.noteText && (
                            <Typography
                                variant="body2"
                                sx={{
                                    whiteSpace: 'pre-line',
                                    mb: 2
                                }}
                            >
                                {note.noteText.length > 300
                                    ? `${note.noteText.substring(0, 300)}...`
                                    : note.noteText}
                            </Typography>
                        )}

                        {/* Link para PDF se for anamnese ou receita */}
                        {(note.noteType === 'Anamnese' || note.noteType === 'Receita') && note.pdfUrl && (
                            <Button
                                variant="outlined"
                                size="small"
                                startIcon={<PictureAsPdfIcon />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(note.pdfUrl, '_blank');
                                }}
                                sx={{
                                    color: typeColor.main,
                                    borderColor: typeColor.main,
                                    '&:hover': {
                                        backgroundColor: alpha(typeColor.light, 0.5),
                                        borderColor: typeColor.main
                                    },
                                    mt: 1
                                }}
                            >
                                Ver PDF
                            </Button>
                        )}

                        {/* Mostrar última atualização */}
                        {note.lastModified && (
                            <Typography
                                variant="caption"
                                color="textSecondary"
                                sx={{
                                    display: 'block',
                                    mt: 2,
                                    fontStyle: 'italic'
                                }}
                            >
                                Atualizado {formatTimeAgo(note.lastModified)}
                            </Typography>
                        )}
                    </Box>
                )}
            </Paper>
        );
    };

    return (
        <ThemeProvider theme={theme}>
            <Drawer
                anchor="right"
                open={open}
                onClose={onClose}
                variant="persistent" // Mudança crucial: usar persistent em vez de temporary
                ModalProps={{
                    hideBackdrop: true,
                }}
                PaperProps={{
                    sx: {
                        width: drawerWidth,
                        borderTopLeftRadius: isMobile ? 0 : '20px',
                        borderBottomLeftRadius: isMobile ? 0 : '20px',
                        maxWidth: '100%',
                        zIndex: 1200, // Mantém um z-index alto
                        boxShadow: "0px 0px 24px rgba(0, 0, 0, 0.2)",
                        borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
                        position: "fixed", // Importante para manter fixo
                        height: "100vh",
                        top: 0,
                        right: 0
                    }
                }}
            >
                {/* Cabeçalho */}
                <AppBar position="sticky" color="default" elevation={0} sx={{ backgroundColor: 'white' }}>
                    <Toolbar sx={{ borderBottom: '1px solid #EAECEF', px: { xs: 2, sm: 3 } }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Histórico de anotações
                        </Typography>
                        <Box sx={{ ml: 'auto', display: 'flex' }}>
                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<CloseIcon />}
                                onClick={onClose}
                                size="small"
                                sx={{ borderRadius: "50px" }}
                            >
                                Fechar
                            </Button>
                        </Box>
                    </Toolbar>
                    {/* Barra de busca e filtros */}
                    <Box sx={{ p: 2, borderBottom: '1px solid #EAECEF' }}>
                        <TextField
                            fullWidth
                            placeholder="Buscar nas anotações..."
                            variant="outlined"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                mb: 2,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '50px',
                                }
                            }}
                        />

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            <Chip
                                label={`Todas (${notesData?.length || 0})`}
                                onClick={() => handleFilterChange("todas")}
                                color={activeFilter === "todas" ? "primary" : "default"}
                                variant={activeFilter === "todas" ? "filled" : "outlined"}
                            />
                            {metrics.anamneses > 0 && (
                                <Chip
                                    label={`Anamneses (${metrics.anamneses})`}
                                    onClick={() => handleFilterChange("anamneses")}
                                    color={activeFilter === "anamneses" ? "primary" : "default"}
                                    variant={activeFilter === "anamneses" ? "filled" : "outlined"}
                                    icon={<HistoryEduIcon />}
                                />
                            )}
                            {metrics.exames > 0 && (
                                <Chip
                                    label={`Exames (${metrics.exames})`}
                                    onClick={() => handleFilterChange("exames")}
                                    color={activeFilter === "exames" ? "primary" : "default"}
                                    variant={activeFilter === "exames" ? "filled" : "outlined"}
                                    icon={<BiotechIcon />}
                                />
                            )}
                            {metrics.receitas > 0 && (
                                <Chip
                                    label={`Receitas (${metrics.receitas})`}
                                    onClick={() => handleFilterChange("receitas")}
                                    color={activeFilter === "receitas" ? "primary" : "default"}
                                    variant={activeFilter === "receitas" ? "filled" : "outlined"}
                                    icon={<MedicationIcon />}
                                />
                            )}
                            {metrics.notas > 0 && (
                                <Chip
                                    label={`Notas (${metrics.notas})`}
                                    onClick={() => handleFilterChange("notas")}
                                    color={activeFilter === "notas" ? "primary" : "default"}
                                    variant={activeFilter === "notas" ? "filled" : "outlined"}
                                    icon={<NotesIcon />}
                                />
                            )}
                        </Box>
                    </Box>
                </AppBar>

                {/* Conteúdo principal - lista de notas */}
                <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1, backgroundColor: '#F8FAFC' }}>
                    {filteredNotes.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <NotesIcon sx={{ fontSize: 60, color: theme.palette.grey[300], mb: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                Nenhuma nota encontrada
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {searchTerm
                                    ? "Tente ajustar sua busca"
                                    : "Não há anotações para este paciente com os filtros atuais"}
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            <Typography variant="subtitle2" sx={{
                                mb: 2,
                                color: theme.palette.grey[500],
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <span>{filteredNotes.length} anotações encontradas</span>

                                <Tooltip title="Clique nas anotações para consultar detalhes durante a anamnese">
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <InfoOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} />
                                        <span>Referência rápida</span>
                                    </Box>
                                </Tooltip>
                            </Typography>

                            {filteredNotes.map(note => renderNoteItem(note))}
                        </>
                    )}
                </Box>

                {/* Rodapé com informação */}
                <Box sx={{
                    p: 2,
                    borderTop: '1px solid #EAECEF',
                    backgroundColor: 'white',
                    textAlign: 'center'
                }}>
                    <Typography variant="caption" color="textSecondary">
                        As anotações são organizadas da mais recente para a mais antiga
                    </Typography>
                </Box>

                {/* Visualização detalhada da anamnese quando selecionada */}
                {viewingAnamneseDetail && selectedAnamneseData && (
                    <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        bgcolor: 'white',
                        zIndex: 1300,
                        overflow: 'auto',
                        p: 2
                    }}>
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Detalhes da Anamnese
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<CloseIcon />}
                                onClick={() => setViewingAnamneseDetail(false)}
                                size="small"
                            >
                                Voltar
                            </Button>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <AnamneseViewer
                            anamneseData={selectedAnamneseData}
                            typeColor={getTypeColor('Anamnese')}
                            onOpenPdf={handleOpenPdf}
                        />
                    </Box>
                )}
            </Drawer>
        </ThemeProvider>
    );
};

export default AnamneseNotesPanel;