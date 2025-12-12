"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Chip,
    Paper,
    Grid,
    Tooltip,
    IconButton,
    CircularProgress,
    useTheme,
    alpha,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Alert
} from "@mui/material";

// Icons
import BiotechIcon from "@mui/icons-material/Biotech";
import NoteAltIcon from "@mui/icons-material/NoteAlt";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";
import FileIcon from "@mui/icons-material/InsertDriveFile";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import FileDownloadDoneIcon from '@mui/icons-material/FileDownloadDone';

// Format date
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Firebase Service
import FirebaseService from "../../../../lib/firebaseService";

const ExamViewer = ({ examData, typeColor, onOpenFile }) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [normalizedData, setNormalizedData] = useState(null);
    const [error, setError] = useState(null);
    const [expandedCategory, setExpandedCategory] = useState(null);

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

                // Determine first category with results to expand
                const firstCategoryWithResults = findFirstCategoryWithResults(normalized.results);
                if (firstCategoryWithResults) {
                    setExpandedCategory(firstCategoryWithResults);
                }
            } catch (error) {
                console.error("Error normalizing exam data:", error);
                setError(`Erro ao processar dados: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        normalizeData();
    }, [examData]);

    // Find first category with results
    const findFirstCategoryWithResults = (results) => {
        if (!results) return null;

        for (const categoryId of Object.keys(results)) {
            if (Object.keys(results[categoryId]).length > 0) {
                return categoryId;
            }
        }
        return null;
    };

    // Get exam categories configuration
    const getExamCategories = () => {
        return [
            {
                id: "LabGerais",
                title: "Exames Laboratoriais Gerais",
                icon: "🩸",
                color: "#EF4444"
            },
            {
                id: "PerfilLipidico",
                title: "Perfil Lipídico",
                icon: "⭕️",
                color: "#F97316"
            },
            {
                id: "Hepaticos",
                title: "Exames Hepáticos e Pancreáticos",
                icon: "🫁",
                color: "#EC4899"
            },
            {
                id: "Inflamatorios",
                title: "Inflamatórios e Imunológicos",
                icon: "🔬",
                color: "#EAB308"
            },
            {
                id: "Hormonais",
                title: "Hormonais",
                icon: "⚗️",
                color: "#8B5CF6"
            },
            {
                id: "Vitaminas",
                title: "Vitaminas e Minerais",
                icon: "💊",
                color: "#F59E0B"
            },
            {
                id: "Infecciosos",
                title: "Infecciosos / Sorologias",
                icon: "🦠",
                color: "#06B6D4"
            },
            {
                id: "Tumorais",
                title: "Marcadores Tumorais",
                icon: "🔍",
                color: "#F43F5E"
            },
            {
                id: "Cardiacos",
                title: "Cardíacos e Musculares",
                icon: "❤️",
                color: "#10B981"
            },
            {
                id: "Imagem",
                title: "Imagem e Diagnóstico",
                icon: "📷",
                color: "#6366F1"
            },
            {
                id: "Outros",
                title: "Outros Exames",
                icon: "🧪",
                color: "#3B82F6"
            }
        ];
    };

    // Get icon and color for exam category
    const getCategoryInfo = (categoryId) => {
        const categories = getExamCategories();
        const category = categories.find(cat => cat.id === categoryId);
        return category || { icon: "🔬", name: "Exame", color: typeColor?.main || "#F59E0B" };
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
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                        Erro ao carregar o exame
                    </Typography>
                    <Typography variant="body2">
                        {error}
                    </Typography>
                </Alert>
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

    // Count total exams with results
    const countTotalExamsWithResults = () => {
        let count = 0;
        if (!normalizedData.results) return count;

        Object.values(normalizedData.results).forEach(category => {
            count += Object.keys(category).length;
        });

        return count;
    };

    // Get categories that have results
    const getCategoriesWithResults = () => {
        const categories = getExamCategories();
        return categories.filter(category =>
            normalizedData.results[category.id] &&
            Object.keys(normalizedData.results[category.id]).length > 0
        );
    };

    // Handle category expansion
    const handleToggleCategory = (categoryId) => {
        setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    };

    return (
        <Box sx={{ pt: 1, pb: 2, width: '100%' }}>

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

            {/* Exam Results - if available, show only filled fields */}
            {hasResults && (
                <Paper elevation={1} sx={{
                    p: 2,
                    borderRadius: '8px',
                    borderLeft: `4px solid ${categoryColor}`,
                    mb: 3
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography
                            variant="subtitle1"
                            sx={{
                                fontWeight: 600,
                                color: categoryColor,
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <BiotechIcon sx={{ mr: 1 }} />
                            Resultados do Exame
                        </Typography>

                        <Chip
                            icon={<FileDownloadDoneIcon />}
                            label={`${countTotalExamsWithResults()} resultados`}
                            size="small"
                            color="primary"
                            sx={{ height: 28 }}
                        />
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Only show categories that have results */}
                    {getCategoriesWithResults().map(category => {
                        const categoryResults = normalizedData.results[category.id] || {};
                        const filledExams = Object.entries(categoryResults);
                        const filledCount = filledExams.length;

                        if (filledCount === 0) return null;

                        return (
                            <Accordion
                                key={category.id}
                                expanded={expandedCategory === category.id}
                                onChange={() => handleToggleCategory(category.id)}
                                sx={{
                                    mb: 2,
                                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
                                    borderRadius: '12px !important',
                                    overflow: 'hidden',
                                    '&:before': {
                                        display: 'none',
                                    },
                                    border: `1px solid ${alpha(category.color, 0.5)}`
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{
                                        backgroundColor: alpha(category.color, 0.15),
                                        borderLeft: `4px solid ${category.color}`,
                                        '&.Mui-expanded': {
                                            borderBottom: `1px solid ${alpha(category.color, 0.2)}`
                                        },
                                        '& .MuiAccordionSummary-content': {
                                            width: '100%',
                                            margin: '12px 0',
                                        },
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Box component="span" sx={{ mr: 1.5, fontSize: '20px' }}>
                                                {category.icon}
                                            </Box>
                                            <Typography sx={{ fontWeight: 600, color: category.color }}>
                                                {category.title}
                                            </Typography>
                                        </Box>

                                        <Chip
                                            label={`${filledCount} exame${filledCount !== 1 ? 's' : ''}`}
                                            size="small"
                                            sx={{
                                                backgroundColor: 'white',
                                                color: category.color,
                                                fontWeight: 500,
                                                fontSize: '11px',
                                                height: '22px'
                                            }}
                                        />
                                    </Box>
                                </AccordionSummary>

                                <AccordionDetails sx={{ p: 0 }}>
                                    <Paper elevation={0} sx={{ width: '100%', borderRadius: 0 }}>
                                        {filledExams.map(([examName, value], index) => (
                                            <Box
                                                key={examName}
                                                sx={{
                                                    p: 2,
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    borderBottom: index < filledExams.length - 1 ?
                                                        `1px solid ${alpha(category.color, 0.1)}` : 'none',
                                                    backgroundColor: alpha(category.color, 0.03),
                                                    '&:hover': {
                                                        backgroundColor: alpha(category.color, 0.05)
                                                    }
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Typography
                                                        sx={{
                                                            fontWeight: 500,
                                                            color: theme.palette.grey[800],
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        {examName}

                                                        {/* Check if it's a non-standard exam detected by AI */}
                                                        {!getExamCategories()
                                                            .find(cat => cat.id === category.id)?.exams
                                                            ?.includes(examName) && (
                                                            <Tooltip title="Detectado pela IA">
                                                                <AutoAwesomeIcon
                                                                    fontSize="small"
                                                                    color="primary"
                                                                    sx={{ ml: 1, fontSize: 16 }}
                                                                />
                                                            </Tooltip>
                                                        )}
                                                    </Typography>
                                                </Box>

                                                <Typography
                                                    sx={{
                                                        fontWeight: 600,
                                                        color: theme.palette.grey[700],
                                                        textAlign: 'right',
                                                        ml: 2
                                                    }}
                                                >
                                                    {value}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Paper>
                                </AccordionDetails>
                            </Accordion>
                        );
                    })}

                    {/* When no categories have results */}
                    {getCategoriesWithResults().length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Typography color="text.secondary">
                                Nenhum resultado de exame encontrado.
                            </Typography>
                        </Box>
                    )}
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
                        {normalizedData.attachments.map((attachment, index) => {
                            const fileInfo = getFileIcon(attachment.fileType, attachment.fileName);

                            return (
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
                                            {fileInfo.icon}
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
                            );
                        })}
                    </Grid>
                </Paper>
            )}
        </Box>
    );
};

export default ExamViewer;