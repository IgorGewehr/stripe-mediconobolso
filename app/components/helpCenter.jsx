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
    Divider,
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
} from "@mui/icons-material";
import FirebaseService from "../../lib/firebaseService";
import { useAuth } from "./authProvider";

// Estrutura dos tutoriais em vídeo
const TUTORIAL_VIDEOS = [
    {
        id: "dashboard",
        title: "Dashboard",
        description: "Visão geral do painel principal e recursos disponíveis",
        // Quando tiver a thumbnail real: thumbnail: "/tutoriais/thumbnails/dashboard.jpg"
        thumbnail: "/tutoriais/thumbnails/default.jpg",
        videoName: "Reportar Problema.mp4" // Substituir pelo nome real: "Dashboard.mp4" quando disponível
    },
    {
        id: "criacao-paciente",
        title: "Criação de Paciente",
        description: "Como cadastrar novos pacientes no sistema",
        thumbnail: "/tutoriais/thumbnails/default.jpg",
        videoName: "Reportar Problema.mp4" // Substituir por: "Criação de Paciente.mp4"
    },
    {
        id: "dashboard-pacientes",
        title: "Dashboard Pacientes",
        description: "Gerenciamento da sua lista de pacientes",
        thumbnail: "/tutoriais/thumbnails/default.jpg",
        videoName: "Reportar Problema.mp4" // Substituir por: "dashboard Pacientes.mp4"
    },
    {
        id: "perfil-paciente",
        title: "Perfil do Paciente",
        description: "Como navegar e editar os dados do perfil do paciente",
        thumbnail: "/tutoriais/thumbnails/default.jpg",
        videoName: "Reportar Problema.mp4" // Substituir por: "Perfil do Paciente.mp4"
    },
    {
        id: "anamnese",
        title: "Anamnese",
        description: "Preenchendo e consultando anamneses de pacientes",
        thumbnail: "/tutoriais/thumbnails/default.jpg",
        videoName: "Reportar Problema.mp4" // Substituir por: "Anamnese.mp4"
    },
    {
        id: "notas",
        title: "Notas",
        description: "Como adicionar e gerenciar notas sobre pacientes",
        thumbnail: "/tutoriais/thumbnails/default.jpg",
        videoName: "Reportar Problema.mp4" // Substituir por: "Notas.mp4"
    },
    {
        id: "criacao-receitas",
        title: "Criação de Receitas",
        description: "Processo de criação e emissão de receitas médicas",
        thumbnail: "/tutoriais/thumbnails/default.jpg",
        videoName: "Reportar Problema.mp4" // Substituir por: "Criação de Receitas.mp4"
    },
    {
        id: "dashboard-receitas",
        title: "Dashboard de Receitas",
        description: "Visualização e gerenciamento de receitas emitidas",
        thumbnail: "/tutoriais/thumbnails/default.jpg",
        videoName: "Reportar Problema.mp4" // Substituir por: "Dashboard de Receitas.mp4"
    },
    {
        id: "agenda-dashboard",
        title: "Agenda Dashboard",
        description: "Gerenciamento da sua agenda de consultas",
        thumbnail: "/tutoriais/thumbnails/default.jpg",
        videoName: "Reportar Problema.mp4" // Substituir por: "Agenda Dashboard.mp4"
    },
    {
        id: "dashboard-consultas-hoje",
        title: "Dashboard Consultas Hoje",
        description: "Visualização de todas as consultas do dia",
        thumbnail: "/tutoriais/thumbnails/default.jpg",
        videoName: "Reportar Problema.mp4" // Substituir por: "Dashboard Consultas Hoje.mp4"
    },
    {
        id: "reportar-problema",
        title: "Reportar Problema",
        description: "Como reportar problemas ou sugerir melhorias",
        thumbnail: "/tutoriais/thumbnails/default.jpg",
        videoName: "Reportar Problema.mp4"
    },
    {
        id: "perfil-medico",
        title: "Perfil do Médico",
        description: "Configuração e atualização do seu perfil profissional",
        thumbnail: "/tutoriais/thumbnails/default.jpg",
        videoName: "Reportar Problema.mp4" // Substituir por: "Perfil do Médico.mp4"
    },
];

// Função assíncrona para buscar a URL do vídeo no Firebase Storage
const getVideoUrl = async (videoName) => {
    try {
        // Aqui assumimos que os vídeos estão armazenados na raiz do storage
        // Implementação real quando disponível
        const path = `tutoriais/${videoName}`;

        // Esta função retorna uma Promise que resolverá para a URL do vídeo
        return await FirebaseService.getStorageFileUrl(path);
    } catch (error) {
        console.error("Erro ao buscar URL do vídeo:", error);
        return null;
    }
};

// Componente principal
const HelpCenter = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { user } = useAuth();

    // Estados
    const [activeTab, setActiveTab] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null);
    const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [filteredVideos, setFilteredVideos] = useState(TUTORIAL_VIDEOS);

    // Estados para o formulário de reportar problema
    const [reportTitle, setReportTitle] = useState("");
    const [reportDetails, setReportDetails] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Filtra vídeos baseado no termo de busca
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredVideos(TUTORIAL_VIDEOS);
        } else {
            const lowercasedSearch = searchTerm.toLowerCase();
            const filtered = TUTORIAL_VIDEOS.filter(
                video =>
                    video.title.toLowerCase().includes(lowercasedSearch) ||
                    video.description.toLowerCase().includes(lowercasedSearch)
            );
            setFilteredVideos(filtered);
        }
    }, [searchTerm]);

    // Handler para mudança de abas
    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        setSearchTerm(""); // Limpa a pesquisa ao trocar de aba
    };

    // Abre o vídeo selecionado
    const handleOpenVideo = async (video) => {
        setSelectedVideo(video);
        setIsLoading(true);

        try {
            // Busca URL do vídeo no Storage
            const url = await getVideoUrl(video.videoName);
            setVideoUrl(url);
            setIsVideoDialogOpen(true);
        } catch (error) {
            console.error("Erro ao carregar vídeo:", error);
            setErrorMessage("Não foi possível carregar o vídeo. Tente novamente mais tarde.");
        } finally {
            setIsLoading(false);
        }
    };

    // Fecha o diálogo de vídeo
    const handleCloseVideo = () => {
        setIsVideoDialogOpen(false);
        setTimeout(() => {
            setSelectedVideo(null);
            setVideoUrl(null);
        }, 300);
    };

    // Envia um relatório de problema
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
            // Preparação dos dados do relatório
            const reportData = {
                title: reportTitle,
                details: reportDetails,
                userId: user.uid,
                userName: user.displayName || user.name || "Usuário",
                userEmail: user.email || "",
                createdAt: new Date(),
                status: "novo", // Status inicial do relatório
            };

            // Envio para o Firestore
            await submitProblemReport(user.uid, reportData);

            // Sucesso - limpa formulário e mostra mensagem
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

    // Função para submeter o relatório ao Firestore
    const submitProblemReport = async (userId, reportData) => {
        // Esta função deve ser implementada no FirebaseService
        // Por enquanto, vamos simular uma chamada de API bem-sucedida

        // Implementação a ser adicionada ao FirebaseService:
        /*
        async createProblemReport(userId, reportData) {
          try {
            const reportRef = doc(collection(this.firestore, "users", userId, "reports"));
            const newReport = {
              ...reportData,
              id: reportRef.id,
              createdAt: new Date(),
            };
            await setDoc(reportRef, newReport);
            return reportRef.id;
          } catch (error) {
            console.error("Erro ao criar relatório de problema:", error);
            throw error;
          }
        }
        */

        // Simular tempo de processamento
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log("Relatório criado:", reportData);
                resolve(true);
            }, 1000);
        });
    };

    // Fecha snackbar de sucesso
    const handleCloseSnackbar = () => {
        setShowSuccess(false);
    };

    return (
        <Box sx={{ maxWidth: "1280px", mx: "auto", p: { xs: 2, md: 3 }, bgcolor: "#F4F9FF", minHeight: "90vh" }}>
            {/* Cabeçalho */}
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
                    variant="h4"
                    component="h1"
                    sx={{
                        color: "#1852FE",
                        mb: 1,
                        fontWeight: 600,
                        fontSize: { xs: "24px", md: "28px" }
                    }}
                >
                    Central de Ajuda
                </Typography>

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

            {/* Abas de navegação */}
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

            {/* Área de pesquisa (apenas para a aba de vídeos) */}
            {activeTab === 0 && (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 3,
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
            )}

            {/* Conteúdo das abas */}
            <Box>
                {/* Aba de tutoriais em vídeo */}
                {activeTab === 0 && (
                    <>
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
                                    onClick={() => setSearchTerm("")}
                                    sx={{ mt: 2, borderRadius: "50px" }}
                                >
                                    Ver todos os tutoriais
                                </Button>
                            </Paper>
                        ) : (
                            <Grid container spacing={3}>
                                {filteredVideos.map((video) => (
                                    <Grid item xs={12} sm={6} md={4} key={video.id}>
                                        <Card
                                            sx={{
                                                height: "100%",
                                                borderRadius: "16px",
                                                transition: "transform 0.2s, box-shadow 0.2s",
                                                "&:hover": {
                                                    transform: "translateY(-4px)",
                                                    boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.1)",
                                                },
                                            }}
                                        >
                                            <CardActionArea onClick={() => handleOpenVideo(video)}>
                                                <CardMedia
                                                    component="img"
                                                    height="140"
                                                    image={video.thumbnail}
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
                                                <CardContent>
                                                    <Typography variant="h6" component="h3" gutterBottom>
                                                        {video.title}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {video.description}
                                                    </Typography>
                                                </CardContent>
                                            </CardActionArea>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}

                        {/* Diálogo de reprodução de vídeo */}
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
                            <DialogContent sx={{ p: 0, bgcolor: "#000" }}>
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
                                            sx={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                width: "100%",
                                                height: "100%",
                                            }}
                                            src={videoUrl}
                                        />
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
                    </>
                )}

                {/* Aba de reportar problema */}
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

                            {/* Informações de contato */}
                            <Card
                                variant="outlined"
                                sx={{
                                    mb: 4,
                                    borderRadius: "12px",
                                    borderColor: "rgba(66, 133, 244, 0.2)",
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
                                    {isSubmitting ? (
                                        <CircularProgress size={24} color="inherit" />
                                    ) : (
                                        "Enviar Relatório"
                                    )}
                                </Button>
                            </Box>
                        </Box>
                    </Paper>
                )}
            </Box>

            {/* Snackbar de sucesso */}
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