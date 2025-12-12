"use client";
import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    Typography,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Tooltip,
    Snackbar,
    Alert,
    Chip,
    Paper
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DeleteIcon from "@mui/icons-material/Delete";
import FirebaseService from "../../../../lib/firebaseService";

// Theme colors for consistent styling
const themeColors = {
    primary: "#1852FE",
    primaryLight: "#E9EFFF",
    primaryDark: "#0A3AA8",
    success: "#0CAF60",
    error: "#FF4B55",
    warning: "#FFAB2B",
    textPrimary: "#111E5A",
    textSecondary: "#4B5574",
    textTertiary: "#7E84A3",
    lightBg: "#F1F3FA",
    backgroundPrimary: "#FFFFFF",
    backgroundSecondary: "#F4F7FF",
    borderColor: "rgba(17, 30, 90, 0.1)",
    shadowColor: "rgba(17, 30, 90, 0.05)"
};

// Document card component - improved version inspired by Card3
const DocumentCard = ({ document, onView, onDelete }) => {
    // Function to determine the color of the category
    const getCategoryColor = (category) => {
        const categoryColors = {
            "Geral": "#1852FE",
            "Exames": "#1C94E0",
            "Laudos": "#FF4B55",
            "Receitas": "#0CAF60",
            "Atestados": "#FFAB2B",
            "Imagens": "#7B4BC9",
            "Relatórios": "#0CAF60"
        };
        return categoryColors[category] || "#4B5574";
    };

    // Format file size
    const formatFileSize = (size) => {
        if (!size) return "";
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Format date
    const formatDate = (dateValue) => {
        if (!dateValue) return "";
        try {
            if (dateValue.seconds) {
                return new Date(dateValue.seconds * 1000).toLocaleDateString('pt-BR');
            }
            if (dateValue instanceof Date) {
                return dateValue.toLocaleDateString('pt-BR');
            }
            return new Date(dateValue).toLocaleDateString('pt-BR');
        } catch (error) {
            return "";
        }
    };

    return (
        <Paper
            elevation={0}
            sx={{
                width: 200,
                height: 90, // Reduced from 110px to 90px
                borderRadius: '10px',
                border: '1px solid #EAECEF',
                backgroundColor: 'white',
                overflow: 'hidden',
                position: 'relative',
                transition: 'all 0.2s ease',
                '&:hover': {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    backgroundColor: themeColors.primaryLight,
                    borderColor: themeColors.primary + '40',
                }
            }}
        >
            {/* Left color indicator based on category */}
            <Box sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '5px',
                backgroundColor: getCategoryColor(document.category)
            }} />

            {/* Document icon */}
            <Box sx={{ p: 1.5, display: 'flex', alignItems: 'flex-start' }}>
                <Box
                    sx={{
                        width: 36, // Reduced from 40px
                        height: 36, // Reduced from 40px
                        borderRadius: '8px',
                        backgroundColor: themeColors.primaryLight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 1.5,
                        flexShrink: 0
                    }}
                >
                    <Box
                        component="img"
                        src="/receitas.svg"
                        alt="document"
                        sx={{ width: 22, height: 22 }} // Reduced from 24px
                    />
                </Box>

                <Box sx={{ overflow: 'hidden', flexGrow: 1 }}>
                    {/* File name with truncation */}
                    <Typography
                        noWrap
                        title={document.fileName}
                        sx={{
                            fontFamily: 'Gellix, sans-serif',
                            fontSize: '12px', // Reduced from 13px
                            fontWeight: 500,
                            color: themeColors.textPrimary,
                            mb: 0.25 // Reduced from 0.5
                        }}
                    >
                        {document.fileName}
                    </Typography>

                    {/* Category chip */}
                    <Chip
                        label={document.category}
                        size="small"
                        sx={{
                            height: 18, // Reduced from 20px
                            fontSize: '10px',
                            fontFamily: 'Gellix, sans-serif',
                            backgroundColor: `${getCategoryColor(document.category)}15`,
                            color: getCategoryColor(document.category),
                            mb: 0.25, // Reduced from 0.5
                            '& .MuiChip-label': {
                                px: 1, // Reduced padding
                                py: 0
                            }
                        }}
                    />

                    {/* Date */}
                    <Typography
                        sx={{
                            fontFamily: 'Gellix, sans-serif',
                            fontSize: '10px',
                            color: themeColors.textTertiary,
                            mt: 0.25 // Reduced from 0.5
                        }}
                    >
                        {formatDate(document.uploadedAt || new Date())}
                    </Typography>
                </Box>
            </Box>

            {/* Action buttons */}
            <Box
                className="document-actions"
                sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 1,
                    py: 0.5, // Reduced from 1
                    transition: 'opacity 0.2s',
                    opacity: 0,
                    '&:hover': {
                        opacity: 1
                    }
                }}
            >
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onView(document);
                    }}
                    sx={{
                        color: themeColors.primary,
                        bgcolor: themeColors.primaryLight,
                        padding: '3px', // Reduced padding
                        '&:hover': {
                            bgcolor: `${themeColors.primaryLight}dd`
                        }
                    }}
                >
                    <OpenInNewIcon sx={{ fontSize: 16 }} /> {/* Reduced from fontSize: small */}
                </IconButton>

                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(document.id);
                    }}
                    sx={{
                        color: themeColors.error,
                        bgcolor: '#FFE8E5',
                        padding: '3px', // Reduced padding
                        '&:hover': {
                            bgcolor: '#FFD6D6'
                        }
                    }}
                >
                    <DeleteIcon sx={{ fontSize: 16 }} /> {/* Reduced from fontSize: small */}
                </IconButton>
            </Box>
        </Paper>
    );
};

// Main component
export default function QuickDocumentsSection({ patientId, doctorId }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);
    const scrollContainerRef = useRef(null);
    const fileInputRef = useRef(null);

    const [alert, setAlert] = useState({
        open: false,
        message: "",
        severity: "success"
    });

    const [newDocument, setNewDocument] = useState({
        file: null,
        category: "Geral",
        description: ""
    });

    // Document categories
    const documentCategories = [
        "Geral",
        "Exames",
        "Laudos",
        "Receitas",
        "Atestados",
        "Imagens",
        "Relatórios"
    ];

    // Fetch documents when component loads
    useEffect(() => {
        if (doctorId && patientId) {
            fetchDocuments();
        }
    }, [doctorId, patientId]);

    // Function to fetch documents from Firebase
    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const docs = await FirebaseService.getPatientDocuments(doctorId, patientId);
            setDocuments(docs || []);
        } catch (error) {
            console.error("Erro ao buscar documentos:", error);
            setAlert({
                open: true,
                message: "Erro ao carregar documentos",
                severity: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    // File input change handler
    const handleFileChange = (e) => {
        if (e.target.files?.length > 0) {
            setNewDocument({
                ...newDocument,
                file: e.target.files[0]
            });
        }
    };

    // Category change handler
    const handleCategoryChange = (e) => {
        setNewDocument({
            ...newDocument,
            category: e.target.value
        });
    };

    // Document upload handler
    const handleUploadDocument = async () => {
        if (!newDocument.file) {
            setAlert({
                open: true,
                message: "Selecione um arquivo para upload",
                severity: "error"
            });
            return;
        }

        try {
            setLoading(true);

            const documentData = {
                category: newDocument.category,
                description: newDocument.description
            };

            await FirebaseService.uploadPatientDocument(
                newDocument.file,
                doctorId,
                patientId,
                documentData
            );

            // Reset form and fetch updated documents
            setNewDocument({
                file: null,
                category: "Geral",
                description: ""
            });
            setUploadDialogOpen(false);
            await fetchDocuments();

            setAlert({
                open: true,
                message: "Documento anexado com sucesso!",
                severity: "success"
            });
        } catch (error) {
            console.error("Erro ao fazer upload:", error);
            setAlert({
                open: true,
                message: `Erro: ${error.message}`,
                severity: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    // Remove document handler
    const handleRemoveDocument = async (documentId) => {
        try {
            setLoading(true);
            await FirebaseService.removePatientDocument(doctorId, patientId, documentId);
            await fetchDocuments();

            setAlert({
                open: true,
                message: "Documento removido com sucesso!",
                severity: "success"
            });
        } catch (error) {
            console.error("Erro ao remover documento:", error);
            setAlert({
                open: true,
                message: `Erro: ${error.message}`,
                severity: "error"
            });
        } finally {
            setLoading(false);
        }
    };

    // Carousel navigation functions
    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            const newPosition = Math.max(0, scrollPosition - 220);
            scrollContainerRef.current.scrollTo({
                left: newPosition,
                behavior: 'smooth'
            });
            setScrollPosition(newPosition);
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            const maxScroll = scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth;
            const newPosition = Math.min(maxScroll, scrollPosition + 220);
            scrollContainerRef.current.scrollTo({
                left: newPosition,
                behavior: 'smooth'
            });
            setScrollPosition(newPosition);
        }
    };

    // Handle scroll events to update position
    const handleScroll = () => {
        if (scrollContainerRef.current) {
            setScrollPosition(scrollContainerRef.current.scrollLeft);
        }
    };

    // Add scroll event listener
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);
            return () => scrollContainer.removeEventListener('scroll', handleScroll);
        }
    }, []);

    const handleViewDocument = (document) => {
        if (document.fileUrl) {
            window.open(document.fileUrl, '_blank');
        }
    };

    const handleCloseAlert = () => {
        setAlert({
            ...alert,
            open: false
        });
    };

    // Format file size for display
    const formatFileSize = (size) => {
        if (!size) return "";
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <Box sx={{ width: '100%', mb: 2 }}>
            {/* Section header - compact version */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 1.5
            }}>
                <Typography
                    variant="subtitle1"
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: 'Gellix, sans-serif',
                        fontSize: '16px',
                        fontWeight: 600
                    }}
                >
                    Documentos Rápidos
                </Typography>

                <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setUploadDialogOpen(true)}
                    size="small"
                    sx={{
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontFamily: 'Gellix, sans-serif',
                        fontSize: '12px',
                        borderColor: themeColors.primary,
                        color: themeColors.primary,
                        height: '32px',
                        '&:hover': {
                            backgroundColor: themeColors.primaryLight,
                            borderColor: themeColors.primary,
                        }
                    }}
                >
                    Adicionar
                </Button>
            </Box>

            {/* Carousel display */}
            <Box sx={{
                position: 'relative',
                width: '100%',
                height: 'auto',
                backgroundColor: themeColors.lightBg,
                borderRadius: '10px',
                p: 2
            }}>
                {loading && (
                    <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        zIndex: 10,
                        borderRadius: '10px'
                    }}>
                        <CircularProgress size={30} sx={{ color: themeColors.primary }} />
                    </Box>
                )}

                {documents.length === 0 ? (
                    <Box sx={{
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        borderRadius: '10px',
                        border: `1px dashed ${themeColors.borderColor}`
                    }}>
                        <Box
                            component="img"
                            src="/receitas.svg"
                            alt="No documents"
                            sx={{ width: 50, height: 50, opacity: 0.5, mb: 2 }}
                        />
                        <Typography
                            sx={{
                                fontFamily: 'Gellix, sans-serif',
                                fontSize: '14px',
                                color: themeColors.textSecondary,
                                textAlign: 'center',
                            }}
                        >
                            Nenhum documento anexado ainda
                        </Typography>
                        <Button
                            variant="text"
                            startIcon={<AddIcon />}
                            onClick={() => setUploadDialogOpen(true)}
                            sx={{
                                mt: 1,
                                textTransform: 'none',
                                fontFamily: 'Gellix, sans-serif',
                                color: themeColors.primary,
                            }}
                        >
                            Adicionar documento
                        </Button>
                    </Box>
                ) : (
                    <>
                        {/* Left navigation arrow */}
                        {scrollPosition > 0 && (
                            <IconButton
                                onClick={scrollLeft}
                                size="small"
                                sx={{
                                    position: 'absolute',
                                    left: -12,
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 2,
                                    backgroundColor: 'white',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                    width: 32,
                                    height: 32,
                                    '&:hover': {
                                        backgroundColor: 'white',
                                    }
                                }}
                            >
                                <KeyboardArrowLeftIcon sx={{ fontSize: 20 }} />
                            </IconButton>
                        )}

                        {/* Horizontal scroll container */}
                        <Box
                            ref={scrollContainerRef}
                            sx={{
                                display: 'flex',
                                overflowX: 'auto',
                                gap: 2,
                                py: 0.5,
                                px: 0.5,
                                scrollbarWidth: 'none',
                                '&::-webkit-scrollbar': {
                                    display: 'none'
                                },
                                msOverflowStyle: 'none'
                            }}
                        >
                            {documents.map((doc) => (
                                <DocumentCard
                                    key={doc.id}
                                    document={doc}
                                    onView={handleViewDocument}
                                    onDelete={handleRemoveDocument}
                                />
                            ))}
                        </Box>

                        {/* Right navigation arrow */}
                        {scrollContainerRef.current &&
                            scrollPosition < (scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth - 10) && (
                                <IconButton
                                    onClick={scrollRight}
                                    size="small"
                                    sx={{
                                        position: 'absolute',
                                        right: -12,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        zIndex: 2,
                                        backgroundColor: 'white',
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                        width: 32,
                                        height: 32,
                                        '&:hover': {
                                            backgroundColor: 'white',
                                        }
                                    }}
                                >
                                    <KeyboardArrowRightIcon sx={{ fontSize: 20 }} />
                                </IconButton>
                            )}
                    </>
                )}
            </Box>

            {/* Document upload dialog - enhanced version */}
            <Dialog
                open={uploadDialogOpen}
                onClose={() => setUploadDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        padding: '10px'
                    }
                }}
            >
                <DialogTitle sx={{
                    fontFamily: 'Gellix, sans-serif',
                    fontSize: '18px',
                    color: themeColors.textPrimary,
                    pb: 1
                }}>
                    Adicionar Documento
                    <IconButton
                        aria-label="close"
                        onClick={() => setUploadDialogOpen(false)}
                        sx={{
                            position: 'absolute',
                            right: 16,
                            top: 16,
                            color: themeColors.textSecondary
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent>
                    <Box
                        sx={{
                            border: `1px dashed ${themeColors.borderColor}`,
                            borderRadius: '12px',
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: themeColors.lightBg,
                            cursor: 'pointer',
                            mb: 3,
                            mt: 1,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                backgroundColor: themeColors.primaryLight,
                                borderColor: themeColors.primary + '40',
                            }
                        }}
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.style.borderColor = themeColors.primary;
                            e.currentTarget.style.backgroundColor = themeColors.primaryLight;
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.style.borderColor = themeColors.borderColor;
                            e.currentTarget.style.backgroundColor = themeColors.lightBg;
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.currentTarget.style.borderColor = themeColors.borderColor;
                            e.currentTarget.style.backgroundColor = themeColors.lightBg;

                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                setNewDocument({
                                    ...newDocument,
                                    file: e.dataTransfer.files[0]
                                });
                            }
                        }}
                    >
                        <input
                            type="file"
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />

                        {!newDocument.file ? (
                            <>
                                <Box
                                    sx={{
                                        width: 60,
                                        height: 60,
                                        borderRadius: '50%',
                                        backgroundColor: themeColors.primaryLight,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mb: 2
                                    }}
                                >
                                    <AddIcon sx={{ fontSize: 30, color: themeColors.primary }} />
                                </Box>
                                <Typography
                                    sx={{
                                        fontFamily: 'Gellix, sans-serif',
                                        color: themeColors.textPrimary,
                                        fontWeight: 500,
                                        fontSize: '16px'
                                    }}
                                >
                                    Clique para selecionar um arquivo
                                </Typography>
                                <Typography
                                    sx={{
                                        fontFamily: 'Gellix, sans-serif',
                                        color: themeColors.textSecondary,
                                        fontSize: '14px',
                                        mt: 1
                                    }}
                                >
                                    ou arraste e solte o arquivo aqui
                                </Typography>
                            </>
                        ) : (
                            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
                                <Box
                                    sx={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: '8px',
                                        backgroundColor: themeColors.primaryLight,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mr: 2
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src="/receitas.svg"
                                        alt="file"
                                        sx={{ width: 30, height: 30 }}
                                    />
                                </Box>
                                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                                    <Typography
                                        noWrap
                                        sx={{
                                            fontFamily: 'Gellix, sans-serif',
                                            color: themeColors.textPrimary,
                                            fontWeight: 500,
                                            fontSize: '14px'
                                        }}
                                    >
                                        {newDocument.file.name}
                                    </Typography>
                                    <Typography sx={{
                                        fontFamily: 'Gellix, sans-serif',
                                        color: themeColors.textSecondary,
                                        fontSize: '12px'
                                    }}>
                                        {formatFileSize(newDocument.file.size)}
                                    </Typography>
                                </Box>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setNewDocument({...newDocument, file: null});
                                    }}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        )}
                    </Box>

                    <FormControl fullWidth>
                        <InputLabel id="doc-category-label">Categoria</InputLabel>
                        <Select
                            labelId="doc-category-label"
                            value={newDocument.category}
                            onChange={handleCategoryChange}
                            label="Categoria"
                            sx={{
                                borderRadius: '10px',
                                '& .MuiSelect-select': {
                                    fontFamily: 'Gellix, sans-serif',
                                }
                            }}
                        >
                            {documentCategories.map((category) => (
                                <MenuItem key={category} value={category}>{category}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>

                <DialogActions sx={{ padding: '8px 24px 20px 24px' }}>
                    <Button
                        onClick={() => setUploadDialogOpen(false)}
                        sx={{
                            fontFamily: 'Gellix, sans-serif',
                            textTransform: 'none',
                            color: themeColors.textSecondary,
                            borderRadius: '8px',
                            '&:hover': {
                                backgroundColor: themeColors.lightBg,
                            }
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleUploadDocument}
                        disabled={!newDocument.file || loading}
                        variant="contained"
                        sx={{
                            fontFamily: 'Gellix, sans-serif',
                            textTransform: 'none',
                            backgroundColor: themeColors.primary,
                            color: 'white',
                            borderRadius: '8px',
                            '&:hover': {
                                backgroundColor: themeColors.primaryDark,
                            },
                            '&.Mui-disabled': {
                                backgroundColor: '#E5E9F2',
                                color: '#AAA',
                            }
                        }}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {loading ? 'Enviando...' : 'Adicionar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar for feedback */}
            <Snackbar
                open={alert.open}
                autoHideDuration={4000}
                onClose={handleCloseAlert}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseAlert}
                    severity={alert.severity}
                    variant="filled"
                    sx={{
                        width: '100%',
                        fontFamily: 'Gellix, sans-serif',
                        borderRadius: '10px'
                    }}
                >
                    {alert.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}