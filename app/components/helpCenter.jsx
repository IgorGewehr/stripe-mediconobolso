"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    Alert,
    Snackbar,
    Paper,
    Grid,
    IconButton,
    Tab,
    Tabs,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useMediaQuery,
    useTheme,
    Tooltip,
    CardMedia,
    CardActionArea,
    Skeleton,
    Chip,
    Fade,
} from "@mui/material";
import {
    PlayCircleOutline as PlayIcon,
    Close as CloseIcon,
    ErrorOutline as ErrorIcon,
    Info as InfoIcon,
    ArrowBack as ArrowBackIcon,
    VideoLibrary as VideoLibraryIcon,
    BugReport as BugReportIcon,
    Search as SearchIcon,
    QuestionAnswer as QuestionAnswerIcon,
    Send as SendIcon,
    CheckCircleOutline as CheckCircleIcon,
} from "@mui/icons-material";
import FirebaseService from "../../lib/firebaseService";
import { useAuth } from "./authProvider";

// Updated Video tutorial categories
const TUTORIAL_CATEGORIES = [
    { id: 'all', label: 'Todos' },
    { id: 'pacientes', label: 'Pacientes' },
    { id: 'agenda', label: 'Agenda' },
    { id: 'anamnese', label: 'Anamnese' },
    { id: 'receitas', label: 'Receitas' },
];

// Updated tutorial videos with corrected categories
const TUTORIAL_VIDEOS = [
    {
        id: "video1",
        title: "Dashboard - Visão Geral",
        description: "Introdução ao painel principal e seus recursos",
        category: "basics",
        duration: "3:45"
    },
    {
        id: "video2",
        title: "Criação de Paciente",
        description: "Como adicionar um novo paciente ao sistema",
        category: "pacientes",
        duration: "4:20"
    },
    {
        id: "video3",
        title: "Gerenciamento de Pacientes",
        description: "Visão geral da tela de pacientes",
        category: "pacientes",
        duration: "3:10"
    },
    {
        id: "video4",
        title: "Perfil do Paciente",
        description: "Como visualizar e editar dados do paciente",
        category: "pacientes",
        duration: "5:30"
    },
    {
        id: "video5",
        title: "Preenchendo Anamnese",
        description: "Guia completo sobre preenchimento de anamnese",
        category: "pacientes",
        duration: "6:15"
    },
    {
        id: "video6",
        title: "Notas de Paciente",
        description: "Como adicionar e gerenciar notas",
        category: "anamnese",
        duration: "2:45"
    },
    {
        id: "video7",
        title: "Criação de Receitas",
        description: "Processo de criação e emissão de receitas",
        category: "anamnese",
        duration: "7:20"
    },
    {
        id: "video8",
        title: "Gerenciamento de Receitas",
        description: "Visualização e edição de receitas emitidas",
        category: "receitas",
        duration: "4:50"
    },
    {
        id: "video9",
        title: "Navegando na Agenda",
        description: "Como usar a agenda de consultas",
        category: "receitas",
        duration: "3:35"
    },
    {
        id: "video10",
        title: "Consultas do Dia",
        description: "Visualização das consultas agendadas",
        category: "receitas",
        duration: "3:15"
    },
    {
        id: "video11",
        title: "Reportando Problemas",
        description: "Como usar o sistema de reporte de problemas",
        category: "agenda",
        duration: "2:30"
    },
    {
        id: "video12",
        title: "Perfil do Médico",
        description: "Como personalizar seu perfil profissional",
        category: "agenda",
        duration: "4:10"
    },
    {
        id: "video13",
        title: "Agenda Avançada",
        description: "Recursos avançados da agenda médica",
        category: "agenda",
        duration: "5:45"
    },
    {
        id: "video14",
        title: "Relatórios e Análises",
        description: "Como gerar e interpretar relatórios",
        category: "basics",
        duration: "6:20"
    }
];

// Get thumbnail URL from Firebase Storage
const getThumbnailUrl = async (videoId) => {
    try {
        const index = videoId.replace('video', '');
        // Incluindo a extensão .png
        const path = `tumb${index}.png`;
        return await FirebaseService.getStorageFileUrl(path);
    } catch (error) {
        console.error("Erro ao buscar thumbnail:", error);
        return null;
    }
};

// Get video URL from Firebase Storage
const getVideoUrl = async (videoId) => {
    try {
        // Incluindo a extensão .mp4
        const path = `${videoId}.mp4`;
        return await FirebaseService.getStorageFileUrl(path);
    } catch (error) {
        console.error("Erro ao buscar vídeo:", error);
        return null;
    }
};

// Main component
const HelpCenter = ({ initialTab }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { user } = useAuth();

    // State for video tutorials
    const [activeTab, setActiveTab] = useState(initialTab);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [filteredVideos, setFilteredVideos] = useState(TUTORIAL_VIDEOS);
    const [thumbnailUrls, setThumbnailUrls] = useState({});
    const [thumbnailsLoading, setThumbnailsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');

    // State for problem reporting
    const [reportTitle, setReportTitle] = useState("");
    const [reportDetails, setReportDetails] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Load thumbnails on component mount
    useEffect(() => {
        const loadThumbnails = async () => {
            setThumbnailsLoading(true);
            const urls = {};

            // Process thumbnails in batches to avoid too many parallel requests
            const batchSize = 4;
            const batches = Math.ceil(TUTORIAL_VIDEOS.length / batchSize);

            for (let i = 0; i < batches; i++) {
                const start = i * batchSize;
                const end = Math.min(start + batchSize, TUTORIAL_VIDEOS.length);
                const batch = TUTORIAL_VIDEOS.slice(start, end);

                await Promise.all(batch.map(async (video) => {
                    try {
                        const url = await getThumbnailUrl(video.id);
                        if (url) {
                            urls[video.id] = url;
                        }
                    } catch (e) {
                        console.error(`Error loading thumbnail for ${video.id}:`, e);
                    }
                }));
            }

            setThumbnailUrls(urls);
            setThumbnailsLoading(false);
        };

        loadThumbnails();
    }, []);

    // Filter videos based on search term and category
    useEffect(() => {
        let filtered = [...TUTORIAL_VIDEOS];

        // Filter by category
        if (activeCategory !== 'all') {
            filtered = filtered.filter(video => video.category === activeCategory);
        }

        // Filter by search term
        if (searchTerm.trim() !== "") {
            const lowercasedSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(
                video =>
                    video.title.toLowerCase().includes(lowercasedSearch) ||
                    video.description.toLowerCase().includes(lowercasedSearch)
            );
        }

        setFilteredVideos(filtered);
    }, [searchTerm, activeCategory]);

    // Tab change handler
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        setSearchTerm(""); // Clear search when changing tabs
    };

    // Category change handler
    const handleCategoryChange = (category) => {
        setActiveCategory(category);
    };

    // Open video dialog
    const handleOpenVideo = async (video) => {
        setSelectedVideo(video);
        setIsLoading(true);

        try {
            const url = await getVideoUrl(video.id);
            setVideoUrl(url);
            setIsVideoDialogOpen(true);

            // Check if browser supports HEVC/H.265
            const isHevcSupported = (() => {
                if (typeof MediaSource !== 'undefined') {
                    // Try to detect HEVC support using MediaSource
                    return MediaSource.isTypeSupported('video/mp4; codecs="hvc1"') ||
                        MediaSource.isTypeSupported('video/mp4; codecs="hev1"');
                }
                // Safari doesn't always report HEVC support via MediaSource
                // Check if it's Safari which generally supports HEVC
                const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                return isSafari || isIOS;
            })();

            // Log codec support for debugging
            console.log("H.265/HEVC support detected:", isHevcSupported);

        } catch (error) {
            console.error("Erro ao carregar vídeo:", error);
            setErrorMessage("Não foi possível carregar o vídeo. Tente novamente mais tarde.");
        } finally {
            setIsLoading(false);
        }
    };

    // Close video dialog
    const handleCloseVideo = () => {
        setIsVideoDialogOpen(false);
        setTimeout(() => {
            setSelectedVideo(null);
            setVideoUrl(null);
        }, 300);
    };

    // Submit problem report
    const handleSubmitReport = async (e) => {
        e.preventDefault();

        if (!reportTitle.trim() || !reportDetails.trim()) {
            setErrorMessage("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        if (!user?.uid) {
            setErrorMessage("Você precisa estar logado para enviar um relatório.");
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            // Prepare report data
            const reportData = {
                title: reportTitle,
                details: reportDetails,
                userId: user.uid,
                userName: user.fullName || user.displayName || user.name || "Usuário",
                userEmail: user.email || "",
                createdAt: new Date(),
                status: "novo", // Initial status
                resolved: false
            };

            // Use the existing method in FirebaseService to create the report
            await FirebaseService.createProblemReport(user.uid, reportData);

            // Success - clear form and show message
            setReportTitle("");
            setReportDetails("");
            setShowSuccess(true);
        } catch (error) {
            console.error("Erro ao enviar relatório:", error);
            setErrorMessage("Ocorreu um erro ao enviar seu relatório. Tente novamente mais tarde.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Close success notification
    const handleCloseSnackbar = () => {
        setShowSuccess(false);
    };

    return (
        <Box sx={{ maxWidth: "1280px", mx: "auto", p: { xs: 2, md: 3 }, bgcolor: "#F4F9FF", minHeight: "90vh" }}>
            {/* Header */}
            <Paper
                elevation={0}
                sx={{
                    p: { xs: 2, md: 3 },
                    borderRadius: "18px",
                    backgroundColor: "#FFFFFF",
                    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
                    mb: 3
                }}
            >
                <Typography
                    variant="subtitle1"
                    sx={{
                        color: "#111E5A",
                        mb: 2
                    }}
                >
                    Vídeos tutoriais e suporte técnico para otimizar sua experiência
                </Typography>
            </Paper>

            {/* Navigation tabs */}
            <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant={isMobile ? "fullWidth" : "standard"}
                centered={!isMobile}
                sx={{
                    mb: 3,
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    "& .MuiTab-root": {
                        textTransform: "none",
                        fontWeight: 500,
                        fontSize: "1rem",
                        minHeight: "56px",
                    },
                    "& .Mui-selected": {
                        color: "#1852FE",
                        fontWeight: 600,
                    },
                    "& .MuiTabs-indicator": {
                        backgroundColor: "#1852FE",
                        height: 3,
                    },
                    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
                }}
            >
                <Tab
                    icon={<VideoLibraryIcon />}
                    iconPosition="start"
                    label="Tutoriais em Vídeo"
                />
                <Tab
                    icon={<BugReportIcon />}
                    iconPosition="start"
                    label="Reportar Problema"
                />
            </Tabs>

            {/* Content */}
            <Box>
                {/* Video tutorials tab */}
                {activeTab === 0 && (
                    <Box>
                        {/* Search & Filters */}
                        <Box sx={{ mb: 3 }}>
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    mb: 2,
                                    backgroundColor: "#fff",
                                    borderRadius: "100px",
                                    p: "4px 16px",
                                    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
                                }}
                            >
                                <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
                                <TextField
                                    fullWidth
                                    variant="standard"
                                    placeholder="Pesquisar tutoriais..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        disableUnderline: true,
                                    }}
                                    sx={{
                                        "& .MuiInputBase-input": {
                                            py: 1.5,
                                        }
                                    }}
                                />
                            </Box>

                            {/* Category filters */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {TUTORIAL_CATEGORIES.map((category) => (
                                    <Chip
                                        key={category.id}
                                        label={category.label}
                                        onClick={() => handleCategoryChange(category.id)}
                                        color={activeCategory === category.id ? "primary" : "default"}
                                        variant={activeCategory === category.id ? "filled" : "outlined"}
                                        sx={{
                                            borderRadius: "100px",
                                            fontWeight: activeCategory === category.id ? 500 : 400,
                                            transition: "all 0.2s ease",
                                            '&:hover': {
                                                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                                            }
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>

                        {/* Videos grid */}
                        {filteredVideos.length === 0 ? (
                            <Paper
                                sx={{
                                    p: 4,
                                    textAlign: "center",
                                    borderRadius: "12px",
                                    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
                                }}
                            >
                                <InfoIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    Nenhum tutorial encontrado
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Tente ajustar sua pesquisa ou explore todos os tutoriais disponíveis.
                                </Typography>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => {
                                        setSearchTerm("");
                                        setActiveCategory("all");
                                    }}
                                    sx={{ mt: 2, borderRadius: "50px" }}
                                >
                                    Ver todos os tutoriais
                                </Button>
                            </Paper>
                        ) : (
                            <Grid container spacing={3}>
                                {filteredVideos.map((video) => (
                                    <Grid item xs={12} sm={6} md={4} key={video.id}>
                                        <Fade in={true} timeout={500} style={{ transitionDelay: `${filteredVideos.indexOf(video) * 50}ms` }}>
                                            <Card
                                                sx={{
                                                    height: "100%",
                                                    borderRadius: "16px",
                                                    transition: "transform 0.2s, box-shadow 0.2s",
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    "&:hover": {
                                                        transform: "translateY(-4px)",
                                                        boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.1)",
                                                    },
                                                }}
                                            >
                                                <CardActionArea
                                                    onClick={() => handleOpenVideo(video)}
                                                    sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                                                >
                                                    {thumbnailsLoading ? (
                                                        <Skeleton
                                                            variant="rectangular"
                                                            height={140}
                                                            animation="wave"
                                                            sx={{ borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}
                                                        />
                                                    ) : (
                                                        <Box sx={{ position: 'relative' }}>
                                                            <CardMedia
                                                                component="img"
                                                                height="140"
                                                                image={thumbnailUrls[video.id] || "/tutoriais/thumbnails/default.jpg"}
                                                                alt={video.title}
                                                                sx={{
                                                                    position: "relative",
                                                                    "&::after": {
                                                                        content: '""',
                                                                        position: "absolute",
                                                                        top: 0,
                                                                        left: 0,
                                                                        width: "100%",
                                                                        height: "100%",
                                                                        backgroundColor: "rgba(0,0,0,0.2)",
                                                                    }
                                                                }}
                                                            />
                                                            <Box
                                                                sx={{
                                                                    position: "absolute",
                                                                    top: "50%",
                                                                    left: "50%",
                                                                    transform: "translate(-50%, -50%)",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    width: "48px",
                                                                    height: "48px",
                                                                    backgroundColor: "rgba(255,255,255,0.8)",
                                                                    borderRadius: "50%",
                                                                    zIndex: 1,
                                                                }}
                                                            >
                                                                <PlayIcon color="primary" fontSize="large" />
                                                            </Box>
                                                            <Chip
                                                                label={video.duration}
                                                                size="small"
                                                                sx={{
                                                                    position: 'absolute',
                                                                    bottom: 8,
                                                                    right: 8,
                                                                    backgroundColor: 'rgba(0,0,0,0.6)',
                                                                    color: 'white',
                                                                    fontWeight: 500,
                                                                    fontSize: '0.7rem'
                                                                }}
                                                            />
                                                        </Box>
                                                    )}
                                                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                                        <Typography variant="h6" component="h3" gutterBottom>
                                                            {video.title}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                            {video.description}
                                                        </Typography>
                                                        <Box sx={{ mt: 'auto' }}>
                                                            <Chip
                                                                label={TUTORIAL_CATEGORIES.find(cat => cat.id === video.category)?.label || video.category}
                                                                size="small"
                                                                variant="outlined"
                                                                color="primary"
                                                                sx={{ borderRadius: 1 }}
                                                            />
                                                        </Box>
                                                    </CardContent>
                                                </CardActionArea>
                                            </Card>
                                        </Fade>
                                    </Grid>
                                ))}
                            </Grid>
                        )}

                        {/* Updated Video playback dialog with H.265/HEVC support */}
                        <Dialog
                            open={isVideoDialogOpen}
                            onClose={handleCloseVideo}
                            maxWidth="lg"
                            fullWidth
                            PaperProps={{
                                sx: {
                                    borderRadius: "16px",
                                    overflow: "hidden",
                                }
                            }}
                        >
                            <DialogTitle sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                bgcolor: "#1852FE",
                                color: "white",
                            }}>
                                <Typography variant="h6" fontWeight={500}>
                                    {selectedVideo?.title}
                                </Typography>
                                <IconButton
                                    edge="end"
                                    color="inherit"
                                    onClick={handleCloseVideo}
                                    aria-label="fechar"
                                >
                                    <CloseIcon />
                                </IconButton>
                            </DialogTitle>
                            <DialogContent sx={{ p: 0, bgcolor: "#000", minHeight: { xs: "300px", md: "500px" } }}>
                                {isLoading ? (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            height: { xs: "300px", md: "500px" },
                                        }}
                                    >
                                        <CircularProgress color="primary" />
                                    </Box>
                                ) : videoUrl ? (
                                    <Box sx={{ width: "100%", height: 0, paddingBottom: "56.25%", position: "relative" }}>
                                        <Box
                                            component="video"
                                            controls
                                            autoPlay
                                            playsInline
                                            sx={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "contain",
                                                backgroundColor: "#000",
                                            }}
                                        >
                                            {/* Specify H.265/HEVC codec for browsers that support it */}
                                            <source src={videoUrl} type="video/mp4; codecs=hvc1" />
                                            {/* Fallback for other browsers */}
                                            <source src={videoUrl} type="video/mp4" />
                                            <Typography color="white" sx={{ p: 3, textAlign: "center" }}>
                                                Seu navegador não suporta vídeos H.265/HEVC. Por favor, tente usar Safari ou um navegador atualizado.
                                            </Typography>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            height: { xs: "300px", md: "500px" },
                                            p: 3,
                                            textAlign: "center",
                                            color: "white",
                                        }}
                                    >
                                        <ErrorIcon sx={{ fontSize: 48, mb: 2 }} />
                                        <Typography variant="h6" gutterBottom>
                                            Não foi possível carregar o vídeo
                                        </Typography>
                                        <Typography variant="body2">
                                            Tente novamente mais tarde ou entre em contato com o suporte.
                                        </Typography>
                                    </Box>
                                )}
                            </DialogContent>
                        </Dialog>
                    </Box>
                )}

                {/* Problem reporting tab */}
                {activeTab === 1 && (
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, md: 4 },
                            borderRadius: "18px",
                            backgroundColor: "#FFFFFF",
                            boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)"
                        }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                            <BugReportIcon sx={{ color: "#1852FE", mr: 1.5, fontSize: 28 }} />
                            <Typography
                                variant="h5"
                                component="h2"
                                sx={{
                                    color: "#1852FE",
                                    fontWeight: 600,
                                }}
                            >
                                Reportar Problema
                            </Typography>
                        </Box>

                        <Typography
                            variant="body1"
                            sx={{
                                color: "#111E5A",
                                mb: 4,
                            }}
                        >
                            Encontrou um problema ao usar o sistema? Envie-nos os detalhes para que possamos resolver o mais rápido possível.
                        </Typography>

                        {errorMessage && (
                            <Alert
                                severity="error"
                                sx={{ mb: 3, borderRadius: "12px" }}
                                onClose={() => setErrorMessage("")}
                            >
                                {errorMessage}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmitReport}>
                            <TextField
                                fullWidth
                                label="Título do problema"
                                variant="outlined"
                                value={reportTitle}
                                onChange={(e) => setReportTitle(e.target.value)}
                                disabled={isSubmitting}
                                required
                                sx={{
                                    mb: 3,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '8px',
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#1852FE',
                                        },
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: '#1852FE',
                                    },
                                }}
                            />

                            <TextField
                                fullWidth
                                label="Descreva o problema em detalhes"
                                multiline
                                rows={6}
                                variant="outlined"
                                value={reportDetails}
                                onChange={(e) => setReportDetails(e.target.value)}
                                disabled={isSubmitting}
                                required
                                placeholder="Forneça o máximo de detalhes possível: em qual tela ocorreu, quais passos foram executados, qual o comportamento esperado e qual o comportamento observado..."
                                sx={{
                                    mb: 4,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '8px',
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#1852FE',
                                        },
                                    },
                                    '& .MuiInputLabel-root.Mui-focused': {
                                        color: '#1852FE',
                                    },
                                }}
                            />

                            {/* Contact info card */}
                            <Card
                                variant="outlined"
                                sx={{
                                    mb: 4,
                                    borderRadius: "12px",
                                    borderColor: "rgba(66, 133, 244, 0.2)",
                                    bgcolor: "#F7FAFF"
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ display: "flex", alignItems: "center" }}>
                                        <QuestionAnswerIcon sx={{ color: "#1852FE", mr: 1.5 }} />
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                color: "#1852FE",
                                                fontWeight: 500,
                                            }}
                                        >
                                            Contato Direto
                                        </Typography>
                                    </Box>

                                    <Typography
                                        sx={{
                                            color: "#111E5A",
                                            mt: 1,
                                        }}
                                    >
                                        Para casos urgentes ou dúvidas adicionais, entre em contato diretamente pelo e-mail:
                                    </Typography>

                                    <Typography
                                        sx={{
                                            color: "#1852FE",
                                            fontWeight: 600,
                                            mt: 1,
                                            fontSize: "16px",
                                            letterSpacing: "0.2px",
                                        }}
                                    >
                                        mediconobolso@gmail.com
                                    </Typography>
                                </CardContent>
                            </Card>

                            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    disabled={isSubmitting}
                                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                    sx={{
                                        borderRadius: "8px",
                                        py: 1.2,
                                        px: 4,
                                        fontWeight: 500,
                                        textTransform: "none",
                                        boxShadow: "0px 4px 12px rgba(24, 82, 254, 0.15)",
                                        "&:hover": {
                                            boxShadow: "0px 6px 16px rgba(24, 82, 254, 0.2)",
                                        },
                                    }}
                                >
                                    {isSubmitting ? "Enviando..." : "Enviar Relatório"}
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                )}
            </Box>

            {/* Success notification */}
            <Snackbar
                open={showSuccess}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity="success"
                    variant="filled"
                    icon={<CheckCircleIcon />}
                    sx={{
                        width: "100%",
                        borderRadius: "8px",
                        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
                    }}
                >
                    Relatório enviado com sucesso! Obrigado pelo feedback.
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default HelpCenter;