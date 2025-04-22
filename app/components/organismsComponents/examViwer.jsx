"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Chip,
    Button,
    CircularProgress,
    useTheme,
    alpha,
    Paper,
    Grid,
    Tooltip,
    IconButton
} from "@mui/material";

// Icons
import BiotechIcon from "@mui/icons-material/Biotech";
import NoteAltIcon from "@mui/icons-material/NoteAlt";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import FileIcon from "@mui/icons-material/InsertDriveFile";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";

// Format date
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Firebase Service
import FirebaseService from "../../../lib/firebaseService";

// Exam results table
import ExamTable from "./examTable";

const ExamViewer = ({ examData, typeColor, onOpenFile }) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [normalizedData, setNormalizedData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const normalizeData = async () => {
            if (!examData) return;

            setLoading(true);
            setError(null);

            try {
                // Start with the exam data we have
                let normalized = { ...examData };
                console.log("Initial examData:", examData);

                // Check if we have exameId (from note) and need to fetch more data
                if (examData.exameId) {
                    try {
                        console.log(`Fetching exam data using exameId: ${examData.exameId}`);

                        const fullData = await FirebaseService.getExam(
                            examData.doctorId || examData.userId,
                            examData.patientId,
                            examData.exameId
                        );

                        if (fullData) {
                            console.log("Retrieved exam data:", fullData);
                            // Merge full data with note data
                            normalized = { ...normalized, ...fullData };
                        } else {
                            console.warn("No exam data found for exameId:", examData.exameId);
                            setError("Dados do exame não encontrados. Verifique se o exame ainda existe.");
                        }
                    } catch (error) {
                        console.error("Error fetching complete exam data:", error);
                        setError(`Erro ao carregar dados do exame: ${error.message}`);
                    }
                }

                // Initialize nested objects if they don't exist
                normalized.results = normalized.results || {};
                normalized.attachments = normalized.attachments || [];

                // If we have a title, make sure it's set
                if (!normalized.title && examData.noteTitle) {
                    normalized.title = examData.noteTitle;
                }

                // If we have noteText but no observations, use noteText
                if (!normalized.observations && examData.noteText) {
                    normalized.observations = examData.noteText;
                }

                // Make sure we have an exam date
                if (!normalized.examDate) {
                    normalized.examDate = examData.consultationDate || examData.createdAt;
                }

                // If we have a category, make sure it's set
                if (!normalized.category) {
                    normalized.category = "LabGerais"; // Default category
                }

                console.log("Normalized data:", normalized);
                setNormalizedData(normalized);
            } catch (error) {
                console.error("Error normalizing exam data:", error);
                setError(`Erro ao processar dados: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        normalizeData();
    }, [examData]);

    // Get icon and color for exam category
    const getCategoryInfo = (categoryId) => {
        const categories = {
            "LabGerais": { icon: "🩸", name: "Exames Laboratoriais Gerais", color: "#EF4444" },
            "PerfilLipidico": { icon: "⭕️", name: "Perfil Lipídico", color: "#F97316" },
            "Hepaticos": { icon: "🫁", name: "Exames Hepáticos e Pancreáticos", color: "#EC4899" },
            "Inflamatorios": { icon: "🔬", name: "Inflamatórios e Imunológicos", color: "#EAB308" },
            "Hormonais": { icon: "⚗️", name: "Hormonais", color: "#8B5CF6" },
            "Vitaminas": { icon: "💊", name: "Vitaminas e Minerais", color: "#F59E0B" },
            "Infecciosos": { icon: "🦠", name: "Infecciosos / Sorologias", color: "#06B6D4" },
            "Tumorais": { icon: "🔍", name: "Marcadores Tumorais", color: "#F43F5E" },
            "Cardiacos": { icon: "❤️", name: "Cardíacos e Musculares", color: "#10B981" },
            "Imagem": { icon: "📷", name: "Imagem e Diagnóstico", color: "#6366F1" },
            "Outros": { icon: "🧪", name: "Outros Exames", color: "#3B82F6" }
        };

        return categories[categoryId] || { icon: "🔬", name: "Exame", color: typeColor?.main || "#F59E0B" };
    };

    // Function to get file icon
    const getFileIcon = (fileType, fileName) => {
        if (!fileType && !fileName) return <FileIcon />;

        if (fileType && fileType.startsWith('image/') ||
            (fileName && (fileName.toLowerCase().endsWith('.jpg') ||
                fileName.toLowerCase().endsWith('.jpeg') ||
                fileName.toLowerCase().endsWith('.png') ||
                fileName.toLowerCase().endsWith('.gif')))) {
            return <ImageIcon sx={{ color: "#10B981" }} />;
        }

        if (fileType === 'application/pdf' || (fileName && fileName.toLowerCase().endsWith('.pdf'))) {
            return <PictureAsPdfIcon sx={{ color: "#EF4444" }} />;
        }

        return <FileIcon sx={{ color: "#3B82F6" }} />;
    };

    // Loading state
    if (loading) {
        return (
            <Box sx={{ py: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={30} sx={{ mr: 2 }} />
                <Typography variant="body1" color="textSecondary">
                    Carregando dados do exame...
                </Typography>
            </Box>
        );
    }

    // Error state
    if (error) {
        return (
            <Box sx={{ py: 3, color: 'error.main' }}>
                <Typography variant="h6" color="error" gutterBottom>
                    Erro ao carregar o exame
                </Typography>
                <Typography variant="body1">
                    {error}
                </Typography>
                <Button
                    variant="outlined"
                    color="primary"
                    sx={{ mt: 2 }}
                    onClick={() => window.location.reload()}
                >
                    Tentar novamente
                </Button>
            </Box>
        );
    }

    // If no data available
    if (!normalizedData) {
        return (
            <Box sx={{ py: 3 }}>
                <Typography variant="body1" color="textSecondary">
                    Nenhum dado de exame disponível.
                </Typography>
            </Box>
        );
    }

    // Get category info
    const categoryInfo = getCategoryInfo(normalizedData.category);
    const categoryColor = categoryInfo.color;

    // Check if there are exam results
    const hasResults = normalizedData.results && Object.keys(normalizedData.results).length > 0;

    return (
        <Box sx={{ pt: 1, pb: 2, width: '100%' }}>
            {/* Header with Exam Title and Category - Left aligned and minimalist */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        backgroundColor: alpha(categoryColor, 0.1),
                        color: categoryColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        fontSize: '22px'
                    }}
                >
                    {categoryInfo.icon || <BiotechIcon sx={{ fontSize: 24 }} />}
                </Box>
                <Box>
                    <Typography
                        variant="h5"
                        sx={{
                            fontWeight: 600,
                            color: '#101828',
                            mb: 0.5
                        }}
                    >
                        {normalizedData.title || "Exame sem título"}
                    </Typography>
                    <Chip
                        label={categoryInfo.name}
                        size="small"
                        sx={{
                            backgroundColor: alpha(categoryColor, 0.1),
                            color: categoryColor,
                            fontWeight: 500,
                            height: 24
                        }}
                    />
                </Box>
            </Box>

            {/* Observations - if available */}
            {normalizedData.observations && (
                <Paper elevation={1} sx={{
                    p: 2,
                    borderRadius: '8px',
                    borderLeft: `4px solid ${categoryColor}`,
                    mb: 3
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <NoteAltIcon sx={{ color: categoryColor, mr: 1 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            Observações
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {normalizedData.observations}
                    </Typography>
                </Paper>
            )}

            {/* Exam Results - if available */}
            {hasResults && (
                <Paper elevation={1} sx={{
                    p: 2,
                    borderRadius: '8px',
                    borderLeft: `4px solid ${categoryColor}`,
                    mb: 3
                }}>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            fontWeight: 600,
                            color: categoryColor,
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <BiotechIcon sx={{ mr: 1 }} />
                        Resultados do Exame
                    </Typography>
                    <ExamTable
                        results={normalizedData.results}
                        readOnly={true}
                    />
                </Paper>
            )}

            {/* Attachments - if available */}
            {normalizedData.attachments && normalizedData.attachments.length > 0 && (
                <Paper elevation={1} sx={{
                    p: 2,
                    borderRadius: '8px',
                    borderLeft: `4px solid ${theme.palette.primary.main}`,
                    mb: 3
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <AttachFileOutlinedIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            Anexos ({normalizedData.attachments.length})
                        </Typography>
                    </Box>
                    <Grid container spacing={2}>
                        {normalizedData.attachments.map((attachment, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 1.5,
                                        border: '1px solid #EAECEF',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: alpha(categoryColor, 0.05),
                                            borderColor: alpha(categoryColor, 0.3),
                                        }
                                    }}
                                    onClick={() => onOpenFile && onOpenFile(attachment)}
                                >
                                    <Box sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '8px',
                                        backgroundColor: alpha(categoryColor, 0.1),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mr: 1.5
                                    }}>
                                        {getFileIcon(attachment.fileType, attachment.fileName)}
                                    </Box>
                                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 500,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {attachment.fileName}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{ color: 'text.secondary' }}
                                        >
                                            {attachment.fileSize || ''}
                                        </Typography>
                                    </Box>
                                    <Tooltip title="Visualizar">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            component="span" // Using span to avoid button inside button
                                            sx={{ display: 'flex' }}
                                        >
                                            <VisibilityIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            )}
        </Box>
    );
};

export default ExamViewer;