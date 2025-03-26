"use client";
import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    IconButton,
    Chip,
    CircularProgress,
    Skeleton,
    Tooltip,
    Fade,
    ButtonGroup,
    Badge,
    Divider
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
import { useAuth } from "../authProvider";
import FirebaseService from "../../../lib/firebaseService";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import PatientNoteDialog from "./novaNotaDialog";
import AnamneseDialog from "./anamneseDialog";
import ReceitaDialog from "./receitasDialog";
import ReceitaNotaCard from "../basicComponents/receitasNotaCard";
import ViewNoteDialog from "./viewNoteDialog";

// Paleta de cores
const themeColors = {
    primary: "#1852FE",
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

// Botão para criar novas fichas
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
                    borderColor: variant === "outlined" ? `${color}DD` : "transparent",
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

// Card de anotação melhorado para exibir de forma diferente para cada tipo
function NotaCard({ nota, onOpen }) {
    // Verifica o tipo de nota e renderiza o componente apropriado
    if (nota.noteType === "Receita") {
        return <ReceitaNotaCard nota={nota} onOpen={onOpen} />;
    }

    // Se é uma anamnese, usa um estilo especial
    const isAnamneseNote = nota.noteType === "Anamnese";

    // Formatar data
    const formatDate = (date) => {
        if (!date) return "";
        const dateObj = date instanceof Date ? date : date.toDate();
        return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
    };

    // Formatar data para criar o texto
    const getCreatedText = (date) => {
        if (!date) return "";
        return `Criado em ${formatDate(date)}`;
    };

    // Funções para renderizar ícones específicos por tipo de arquivo
    const getFileIcon = (fileType) => {
        if (!fileType) return <FileIcon fontSize="small" />;
        if (fileType.startsWith('image/')) return <ImageIcon fontSize="small" sx={{ color: "#10B981" }} />;
        if (fileType.includes('pdf')) return <PictureAsPdfIcon fontSize="small" sx={{ color: "#EF4444" }} />;
        return <FileIcon fontSize="small" sx={{ color: "#3B82F6" }} />;
    };

    // Determina o tipo de arquivo para exibir o ícone correto
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
                {/* Coluna esquerda - Data da consulta */}
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
                            ml: 1.75 // Alinhado com o texto após o ícone acima
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

                {/* Coluna central - Conteúdo principal */}
                <Box sx={{
                    flex: 1,
                    px: 2.5,
                    py: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    overflow: "hidden"
                }}>
                    {/* Título */}
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

                    {/* Conteúdo - Prévia do texto */}
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

                {/* Coluna direita - Anexos */}
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
                        {/* Badge com o número de anexos */}
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

                        {/* Ícones dos anexos */}
                        <Box sx={{ display: "flex", gap: 0.75, justifyContent: "center" }}>
                            {/* Mostra até dois anexos com ícones */}
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

                            {/* Indicador de mais anexos */}
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
                                        fontSize: 12,
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

// Skeletons para carregamento
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

// Estado vazio, sem notas
function EmptyState({ onCreate }) {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 3, // Reduzido para ficar mais compacto
                px: 2,
                backgroundColor: "#F8F9FA",
                borderRadius: "16px",
                border: `1px dashed ${themeColors.borderColor}`,
                mt: 1, // Reduzido para aproximar do header
                mb: 1
            }}
        >
            <Box
                component="img"
                src="/receitas.svg"
                alt="Sem anotações"
                sx={{
                    width: 80, // Reduzido para mais compacto
                    height: 80,
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

// Seção principal de notas
export default function NotasSection({ pacienteId }) {
    // Estados
    const [notasData, setNotasData] = useState([]);
    const [filteredNotas, setFilteredNotas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados para controle de diálogos
    const [openNoteDialog, setOpenNoteDialog] = useState(false);
    const [openReceitaDialog, setOpenReceitaDialog] = useState(false);
    const [openAnamneseDialog, setOpenAnamneseDialog] = useState(false);
    const [selectedNota, setSelectedNota] = useState(null);
    const [selectedReceita, setSelectedReceita] = useState(null);
    const [openViewNoteDialog, setOpenViewNoteDialog] = useState(false);
    const [selectedAnamnese, setSelectedAnamnese] = useState(null);

    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successAction, setSuccessAction] = useState("");

    // Filtros de visualização
    const [activeFilter, setActiveFilter] = useState("todas");

    // Métricas para badges
    const [metrics, setMetrics] = useState({
        notas: 0,
        anamneses: 0,
        receitas: 0
    });

    // Context
    const { user } = useAuth();

    // Efeito para carregar as notas
    useEffect(() => {
        if (pacienteId && user?.uid) {
            fetchNotas();
        }
    }, [pacienteId, user]);

    // Efeito para aplicar filtros
    useEffect(() => {
        applyFilters();
    }, [notasData, activeFilter]);

    // Função para buscar as notas do Firebase
    const fetchNotas = async () => {
        try {
            setIsLoading(true);
            const notes = await FirebaseService.listNotes(user.uid, pacienteId);

            // Ordenar por data de criação, mais recentes primeiro
            const sortedNotes = notes.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
                const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
                return dateB - dateA;
            });

            setNotasData(sortedNotes);

            // Calcular métricas
            calculateMetrics(sortedNotes);

        } catch (error) {
            console.error("Erro ao carregar notas:", error);
            setError("Não foi possível carregar as notas. Tente novamente mais tarde.");
        } finally {
            setIsLoading(false);
        }
    };

    // Calcular métricas para os badges
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

    // Aplicar filtros às notas
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

    // Função para abrir o dialog de criação de nova nota
    const handleOpenCreateNoteDialog = () => {
        setSelectedNota(null);
        setOpenNoteDialog(true);
    };

    // Função para abrir o dialog de criação de nova receita
    const handleOpenCreateReceitaDialog = () => {
        setSelectedReceita(null);
        setOpenReceitaDialog(true);
    };

    // Função para abrir o dialog de criação de anamnese
    const handleOpenCreateAnamneseDialog = () => {
        setOpenAnamneseDialog(true);
    };

    // Função para abrir o dialog de edição/visualização de nota existente
    const handleOpenNota = (nota) => {
        // Armazena a nota selecionada e abre o dialog de visualização
        setSelectedNota(nota);
        setOpenViewNoteDialog(true);
    };
    const handleCloseViewNoteDialog = () => {
        setOpenViewNoteDialog(false);
        setSelectedNota(null);
    };

    const handleEditFromView = (nota) => {
        // Fecha o dialog de visualização
        setOpenViewNoteDialog(false);

        // Com base no tipo de nota, abre o dialog apropriado para edição
        if (nota.noteType === "Receita" && nota.prescriptionId) {
            // Abrir diálogo de receita
            setSelectedReceita({
                id: nota.prescriptionId
            });
            setOpenReceitaDialog(true);
        } else if (nota.noteType === "Anamnese") {
            setOpenAnamneseDialog(true);
            // Pass the anamneseId from the note
            setSelectedAnamnese(nota.anamneseId);
        } else {
            // Para notas regulares, abre o diálogo padrão de nota
            setOpenNoteDialog(true);
        }
    };
    // Fechar os diálogos
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

    // Handler para criar ou atualizar nota
    const handleSaveNote = async (notaData) => {
        try {
            if (selectedNota && selectedNota.id) {
                // Se for edição, atualize a nota no Firebase
                await FirebaseService.updateNote(user.uid, pacienteId, selectedNota.id, notaData);
                setSuccessAction("atualizada");
            } else {
                // Se for nova nota, crie-a no Firebase
                await FirebaseService.createNote(user.uid, pacienteId, notaData);
                setSuccessAction("criada");
            }

            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);

            // Fecha o diálogo
            setOpenNoteDialog(false);

            // Recarrega a lista de notas atualizada do Firebase
            await fetchNotas();

        } catch (error) {
            console.error("Erro ao salvar a nota:", error);
            // Opcional: exibir feedback de erro
        }
    };

    // Handler para salvar receita
    const handleSaveReceita = async (receitaId) => {
        try {
            // Atualiza a lista de notas com os dados mais recentes do Firebase
            await fetchNotas();

            // Mostra mensagem de sucesso
            setSuccessAction("criada");
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);

            // Fecha o diálogo de receita
            setOpenReceitaDialog(false);
            setSelectedReceita(null);
        } catch (error) {
            console.error("Erro ao salvar receita:", error);
            // Aqui você pode exibir um feedback de erro se necessário
        }
    };

    // Handler para salvar anamnese
    const handleSaveAnamnese = async (anamneseId) => {
        try {
            // Atualiza a lista de notas com os dados mais recentes do Firebase
            await fetchNotas();

            // Mostra mensagem de sucesso
            setSuccessAction("criada");
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);

            // Fecha o diálogo de anamnese
            setOpenAnamneseDialog(false);
        } catch (error) {
            console.error("Erro ao salvar anamnese:", error);
            // Aqui você pode exibir um feedback de erro se necessário
        }
    };

    // Handler para deletar nota
    const handleDeleteNote = (noteId) => {
        // Remover a nota do estado local
        setNotasData(prevNotas => prevNotas.filter(n => n.id !== noteId));

        // Mostrar mensagem de sucesso
        setSuccessAction("excluída");
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);

        // Fechar o dialog
        setOpenNoteDialog(false);

        // Atualizar métricas
        calculateMetrics(notasData.filter(n => n.id !== noteId));
    };

    // Atualizar filtro ativo
    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
    };

    // Definir o texto do botão "Criar nova nota" com base no filtro atual
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

    // Definir o handler para o botão de ação principal com base no filtro atual
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
            {/* Header: título e botões */}
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

            {/* Filtros de visualização */}
            <Box sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2
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

                {/* Botão de ação contextual */}
                <ActionButton
                    onClick={handlePrimaryAction}
                    color={themeColors.primary}
                    startIcon={<AddIcon />}
                    disabled={isLoading}
                >
                    {getActionButtonText()}
                </ActionButton>
            </Box>

            {/* Mensagem de sucesso */}
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

            {/* Lista de notas */}
            <Box
                sx={{
                    width: "100%",
                    maxHeight: "480px",
                    overflowY: "auto",
                    paddingRight: 1,
                    // Estilos para a barra de rolagem
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
                    // Skeletons para carregamento
                    Array(3).fill().map((_, index) => (
                        <NotaCardSkeleton key={index} />
                    ))
                ) : error ? (
                    // Mensagem de erro
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
                    // Estado vazio - sem notas
                    <EmptyState onCreate={handlePrimaryAction} />
                ) : (
                    // Lista de notas
                    filteredNotas.map((nota) => (
                        <NotaCard
                            key={nota.id}
                            nota={nota}
                            onOpen={handleOpenNota}
                        />
                    ))
                )}
            </Box>

            {/* Dialog para criar/editar nota */}
            <PatientNoteDialog
                open={openNoteDialog}
                onClose={handleCloseNoteDialog}
                note={selectedNota}
                patientId={pacienteId}
                onSave={handleSaveNote}
                onDelete={handleDeleteNote}
            />

            {/* Dialog para criar/editar receita */}
            <ReceitaDialog
                open={openReceitaDialog}
                onClose={handleCloseReceitaDialog}
                patientId={pacienteId}
                doctorId={user?.uid}
                receitaId={selectedReceita?.id}
                onSave={handleSaveReceita}
            />

            {/* Dialog para criar anamnese */}
            <AnamneseDialog
                open={openAnamneseDialog}
                onClose={handleCloseAnamneseDialog}
                patientId={pacienteId}
                doctorId={user?.uid}
                anamneseId={selectedAnamnese}
                onSave={handleSaveAnamnese}
            />

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
        </Box>
    );
}