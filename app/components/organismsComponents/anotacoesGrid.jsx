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
    Fade
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import FileIcon from "@mui/icons-material/InsertDriveFile";
import { useAuth } from "../authProvider";
import FirebaseService from "../../../lib/firebaseService";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import PatientNoteDialog from "./novaNotaDialog";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";

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
};

// Botão para criar nova ficha
function CriarNovaFichaButton({ onClick, disabled }) {
    return (
        <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onClick}
            disabled={disabled}
            sx={{
                height: 46,
                padding: "0 24px",
                borderRadius: "99px",
                backgroundColor: themeColors.primary,
                color: "#FFF",
                fontFamily: "Gellix",
                fontSize: 14,
                fontWeight: 500,
                textTransform: "none",
                "&:hover": {
                    backgroundColor: "#0d47e0",
                },
                "&.Mui-disabled": {
                    backgroundColor: "#A0AEC0",
                    color: "#FFF",
                }
            }}
        >
            Criar nova ficha
        </Button>
    );
}

// Card de anotação melhorado
// Card de anotação redesenhado conforme imagem de exemplo
// Enhanced NotaCard function to highlight anamnesis notes
function NotaCard({ nota, onOpen }) {
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

    // Check if it's an anamnesis note
    const isAnamneseNote = nota.noteType === "Anamnese";

    return (
        <Card
            sx={{
                width: "100%",
                borderRadius: "12px",
                border: `1px solid ${isAnamneseNote ? "#6366F1" : "#EAECEF"}`,
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
                    borderColor: isAnamneseNote ? "#6366F1" : "#D0D5DD",
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
                                    ? "#6366F1"
                                    : nota.noteType === "Consulta" ? themeColors.success : themeColors.primary,
                                fontSize: 8,
                                mr: 0.75
                            }}
                        />
                        <Typography
                            variant="caption"
                            sx={{
                                color: isAnamneseNote
                                    ? "#6366F1"
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
                            color: isAnamneseNote ? "#6366F1" : "#111E5A",
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
                                color: isAnamneseNote ? "#6366F1" : themeColors.primary,
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
                                        color: isAnamneseNote ? "#6366F1" : themeColors.primary,
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
                        backgroundColor: "#6366F1",
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
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onCreate}
                sx={{
                    borderRadius: "99px",
                    backgroundColor: themeColors.primary,
                    color: "#FFF",
                    fontFamily: "Gellix",
                    textTransform: "none",
                    px: 3,
                    py: 1
                }}
            >
                Criar primeira anotação
            </Button>
        </Box>
    );
}

// Seção principal de notas
export default function NotasSection({ pacienteId }) {
    // Estados
    const [notasData, setNotasData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedNota, setSelectedNota] = useState(null);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successAction, setSuccessAction] = useState("");

    // Context
    const { user } = useAuth();

    // Efeito para carregar as notas
    useEffect(() => {
        if (pacienteId && user?.uid) {
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
                } catch (error) {
                    console.error("Erro ao carregar notas:", error);
                    setError("Não foi possível carregar as notas. Tente novamente mais tarde.");
                } finally {
                    setIsLoading(false);
                }
            };

            fetchNotas();
        }
    }, [pacienteId, user]);

    // Função para abrir o dialog de criação de nova nota
    const handleOpenCreateDialog = () => {
        setSelectedNota(null);
        setOpenDialog(true);
    };

    // Função para abrir o dialog de edição/visualização de nota existente
    const handleOpenEditDialog = (nota) => {
        setSelectedNota(nota);
        setOpenDialog(true);
    };

    // Fechar o dialog
    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    // Handler para criar ou atualizar nota
    const handleSaveNote = (notaData) => {
        // Se estamos editando uma nota existente
        if (selectedNota && selectedNota.id) {
            // Atualizar a nota no estado local
            setNotasData(prevNotas => {
                const index = prevNotas.findIndex(n => n.id === selectedNota.id);
                if (index !== -1) {
                    const updatedNotas = [...prevNotas];
                    updatedNotas[index] = {
                        ...prevNotas[index],
                        ...notaData
                    };
                    return updatedNotas;
                }
                return prevNotas;
            });

            // Mostrar mensagem de sucesso
            setSuccessAction("atualizada");
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);

        } else {
            // Adicionar a nova nota ao estado local
            setNotasData(prevNotas => [notaData, ...prevNotas]);

            // Mostrar mensagem de sucesso
            setSuccessAction("criada");
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);
        }

        // Fechar o dialog
        setOpenDialog(false);
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
        setOpenDialog(false);
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
            {/* Header: título e botão */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
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
                <CriarNovaFichaButton
                    onClick={handleOpenCreateDialog}
                    disabled={isLoading}
                />
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
                            onClick={() => window.location.reload()}
                        >
                            Tentar novamente
                        </Button>
                    </Box>
                ) : notasData.length === 0 ? (
                    // Estado vazio - sem notas
                    <EmptyState onCreate={handleOpenCreateDialog} />
                ) : (
                    // Lista de notas
                    notasData.map((nota) => (
                        <NotaCard
                            key={nota.id}
                            nota={nota}
                            onOpen={handleOpenEditDialog}
                        />
                    ))
                )}
            </Box>

            {/* Dialog para criar/editar nota */}
            <PatientNoteDialog
                open={openDialog}
                onClose={handleCloseDialog}
                note={selectedNota}
                patientId={pacienteId}
                onSave={handleSaveNote}
                onDelete={handleDeleteNote}
            />
        </Box>
    );
}
