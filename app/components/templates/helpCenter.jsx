"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    Card,
    CardContent,
    Paper,
    Grid,
    IconButton,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    useMediaQuery,
    useTheme,
    CardMedia,
    CardActionArea,
    Skeleton,
    Chip,
    Fade,
    TextField,
} from "@mui/material";
import {
    PlayCircleOutline as PlayIcon,
    Close as CloseIcon,
    ErrorOutline as ErrorIcon,
    Info as InfoIcon,
    VideoLibrary as VideoLibraryIcon,
    Search as SearchIcon,
} from "@mui/icons-material";
import { storageService } from '@/lib/services/firebase';

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
        return await storageService.getStorageFileUrl(path);
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
        return await storageService.getStorageFileUrl(path);
    } catch (error) {
        console.error("Erro ao buscar vídeo:", error);
        return null;
    }
};

// Main component
const HelpCenter = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // State for video tutorials
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [filteredVideos, setFilteredVideos] = useState(TUTORIAL_VIDEOS);
    const [thumbnailUrls, setThumbnailUrls] = useState({});
    const [thumbnailsLoading, setThumbnailsLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');

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

    return (
        <Box sx={{ maxWidth: "1280px", mx: "auto", p: { xs: 2, md: 3 }, bgcolor: "#F4F9FF", minHeight: "90vh" }}>
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

            {/* Video playback dialog with H.265/HEVC support */}
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
    );
};

export default HelpCenter;