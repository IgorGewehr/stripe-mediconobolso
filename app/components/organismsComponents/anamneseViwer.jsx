import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Grid,
    Paper,
    Tabs,
    Tab,
    Avatar,
    Divider,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    IconButton,
    Tooltip,
    useTheme,
    Fade,
    CircularProgress,
    alpha
} from "@mui/material";

// Ícones
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import SpeedIcon from "@mui/icons-material/Speed";
import BubbleChartIcon from "@mui/icons-material/BubbleChart";
import MedicationIcon from "@mui/icons-material/Medication";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import MedicalInformationIcon from "@mui/icons-material/MedicalInformation";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import LunchDiningIcon from "@mui/icons-material/LunchDining";
import WorkIcon from "@mui/icons-material/Work";
import SmokingRoomsIcon from "@mui/icons-material/SmokingRooms";
import LocalBarIcon from "@mui/icons-material/LocalBar";
import SportsBasketballIcon from "@mui/icons-material/SportsBasketball";
import NightlifeIcon from "@mui/icons-material/Nightlife";
import PsychologyIcon from "@mui/icons-material/Psychology";
import CoronavirusIcon from "@mui/icons-material/Coronavirus";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import AirlineSeatFlatIcon from "@mui/icons-material/AirlineSeatFlat";
import BrainIcon from "@mui/icons-material/Psychology";
import WcIcon from "@mui/icons-material/Wc";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import HealingIcon from "@mui/icons-material/Healing";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EscalatorWarningIcon from "@mui/icons-material/EscalatorWarning";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import NoteAltIcon from "@mui/icons-material/NoteAlt";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FilterListIcon from "@mui/icons-material/FilterList";
import EventIcon from "@mui/icons-material/Event";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import BottomNavigation from "@mui/material/BottomNavigation";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AirIcon from "@mui/icons-material/Air";

// Formatação de data
import { format, formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Serviço Firebase (para buscar dados da anamnese se necessário)
import FirebaseService from "../../../lib/firebaseService";

const AnamneseViewer = ({ anamneseData, typeColor, onOpenPdf }) => {
    const theme = useTheme();
    const [currentTab, setCurrentTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [mobileView, setMobileView] = useState(window.innerWidth < 768);

    // Estado para armazenar os dados normalizados da anamnese
    const [normalizedData, setNormalizedData] = useState(null);

    // Efeito para normalizar os dados da anamnese, independente de sua estrutura
    useEffect(() => {
        const normalizeData = async () => {
            if (!anamneseData) return;

            setLoading(true);

            try {
                // Se os dados estiverem em um formato diferente, vamos normalizar
                let normalized = { ...anamneseData };

                // Verificar se temos anamneseId e precisamos buscar mais dados
                if (anamneseData.anamneseId && !anamneseData.chiefComplaint) {
                    try {
                        // Tentar buscar dados completos da anamnese
                        const fullData = await FirebaseService.getAnamnese(
                            anamneseData.doctorId,
                            anamneseData.patientId,
                            anamneseData.anamneseId
                        );

                        if (fullData) {
                            // Mesclar os dados completos com os dados da nota
                            normalized = { ...normalized, ...fullData };
                        }
                    } catch (error) {
                        console.error("Erro ao buscar dados completos da anamnese:", error);
                    }
                }

                // Inicializar objetos aninhados caso não existam
                normalized.physicalExam = normalized.physicalExam || {};
                normalized.physicalExam.vitalSigns = normalized.physicalExam.vitalSigns || {};
                normalized.systemsReview = normalized.systemsReview || {};
                normalized.socialHistory = normalized.socialHistory || {};

                // Garantir que listas sejam arrays
                normalized.medicalHistory = Array.isArray(normalized.medicalHistory) ? normalized.medicalHistory : [];
                normalized.surgicalHistory = Array.isArray(normalized.surgicalHistory) ? normalized.surgicalHistory : [];
                normalized.currentMedications = Array.isArray(normalized.currentMedications) ? normalized.currentMedications : [];
                normalized.allergies = Array.isArray(normalized.allergies) ? normalized.allergies : [];

                setNormalizedData(normalized);
            } catch (error) {
                console.error("Erro ao normalizar dados da anamnese:", error);
            } finally {
                setLoading(false);
            }
        };

        normalizeData();
    }, [anamneseData]);

    // Efeito para detectar tamanho da tela e ajustar visualização
    useEffect(() => {
        const handleResize = () => {
            setMobileView(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Função para formatar datas
    const formatDate = (date) => {
        if (!date) return "";
        const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
        return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    };

    const formatTimeAgo = (date) => {
        if (!date) return "";
        const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
        return formatDistance(dateObj, new Date(), { addSuffix: true, locale: ptBR });
    };

    // Verifica se há dados para exibir
    if (loading || !normalizedData) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center', mt: 2 }}>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="h6" color="textSecondary">
                    Carregando dados da anamnese...
                </Typography>
            </Paper>
        );
    }

    // Função para renderizar ícone com valor nos sinais vitais
    const renderVitalSign = (icon, label, value, unit, color) => {
        if (!value) return null;

        return (
            <Grid item xs={6} sm={4} md={2.4}>
                <Paper sx={{
                    p: 2,
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: '16px',
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
                    border: `1px solid ${alpha(color, 0.2)}`
                }}>
                    {React.cloneElement(icon, { sx: { color: color, fontSize: 36, mb: 1 } })}
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        {label}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.grey[800] }}>
                        {value} {unit}
                    </Typography>
                </Paper>
            </Grid>
        );
    };

    // Função para renderizar lista de itens com ícones
    const renderItemList = (items, emptyMessage = "Nenhum item encontrado", mainColor = typeColor.main) => {
        if (!items || items.length === 0) {
            return (
                <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', mt: 1 }}>
                    {emptyMessage}
                </Typography>
            );
        }

        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {items.map((item, index) => (
                    <Chip
                        key={index}
                        label={item}
                        size="medium"
                        sx={{
                            backgroundColor: alpha(mainColor, 0.08),
                            color: typeof mainColor === 'string' ? mainColor : typeColor.dark,
                            fontWeight: 500,
                            borderRadius: '16px'
                        }}
                    />
                ))}
            </Box>
        );
    };

    // Função para renderizar seção de texto
    const renderTextSection = (label, text, icon = null, defaultColor = typeColor.main) => {
        if (!text) return null;

        return (
            <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {icon && (
                        <Avatar
                            sx={{
                                backgroundColor: alpha(defaultColor, 0.1),
                                color: defaultColor,
                                width: 28,
                                height: 28,
                                mr: 1
                            }}
                        >
                            {icon}
                        </Avatar>
                    )}
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: typeColor.dark }}>
                        {label}
                    </Typography>
                </Box>
                <Paper sx={{
                    p: 2,
                    backgroundColor: alpha(typeColor.light, 0.3),
                    borderRadius: '12px',
                    border: `1px solid ${alpha(typeColor.main, 0.1)}`
                }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                        {text}
                    </Typography>
                </Paper>
            </Box>
        );
    };

    // Função para renderizar seção dobrável
    const renderAccordionSection = (title, content, iconComponent, defaultExpanded = false, customColor) => {
        if (!content) return null;

        const color = customColor || typeColor.main;

        return (
            <Accordion
                defaultExpanded={defaultExpanded}
                sx={{
                    mb: 2,
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
                    backgroundColor: alpha(color, 0.03),
                    border: `1px solid ${alpha(color, 0.1)}`,
                    '&:before': { display: 'none' },
                    borderRadius: '12px',
                    overflow: 'hidden',
                }}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                        backgroundColor: alpha(color, 0.05),
                        '&.Mui-expanded': {
                            borderBottom: `1px solid ${alpha(color, 0.1)}`
                        }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                            sx={{
                                backgroundColor: alpha(color, 0.1),
                                color: color,
                                width: 28,
                                height: 28,
                                mr: 1
                            }}
                        >
                            {iconComponent}
                        </Avatar>
                        <Typography sx={{ fontWeight: 600, color: theme.palette.grey[800] }}>
                            {title}
                        </Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3 }}>
                    {typeof content === 'string' ? (
                        <Typography sx={{ whiteSpace: 'pre-line' }}>{content}</Typography>
                    ) : (
                        content
                    )}
                </AccordionDetails>
            </Accordion>
        );
    };

    // Renderiza tabs para organizar as seções
    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    // Sistema de navegação para mobile
    const renderMobileNavigation = () => {
        return (
            <Paper
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    borderTop: '1px solid #EAECEF',
                    borderRadius: '24px 24px 0 0'
                }}
                elevation={3}
            >
                <BottomNavigation
                    value={currentTab}
                    onChange={(event, newValue) => {
                        setCurrentTab(newValue);
                    }}
                    showLabels
                >
                    <BottomNavigationAction
                        label="Queixa"
                        icon={<MedicalInformationIcon />}
                        sx={{
                            color: currentTab === 0 ? typeColor.main : theme.palette.grey[600],
                            '& .MuiBottomNavigationAction-label': {
                                fontSize: '0.7rem'
                            }
                        }}
                    />
                    <BottomNavigationAction
                        label="Exame"
                        icon={<AccessibilityNewIcon />}
                        sx={{
                            color: currentTab === 1 ? typeColor.main : theme.palette.grey[600],
                            '& .MuiBottomNavigationAction-label': {
                                fontSize: '0.7rem'
                            }
                        }}
                    />
                    <BottomNavigationAction
                        label="Histórico"
                        icon={<HistoryEduIcon />}
                        sx={{
                            color: currentTab === 2 ? typeColor.main : theme.palette.grey[600],
                            '& .MuiBottomNavigationAction-label': {
                                fontSize: '0.7rem'
                            }
                        }}
                    />
                    <BottomNavigationAction
                        label="Hábitos"
                        icon={<LunchDiningIcon />}
                        sx={{
                            color: currentTab === 3 ? typeColor.main : theme.palette.grey[600],
                            '& .MuiBottomNavigationAction-label': {
                                fontSize: '0.7rem'
                            }
                        }}
                    />
                    <BottomNavigationAction
                        label="PDF"
                        icon={<PictureAsPdfIcon />}
                        onClick={onOpenPdf}
                        sx={{
                            color: theme.palette.error.main,
                            '& .MuiBottomNavigationAction-label': {
                                fontSize: '0.7rem'
                            }
                        }}
                    />
                </BottomNavigation>
            </Paper>
        );
    };

    // Elementos para desktop que não aparecem em mobile
    const desktopElements = () => {
        if (mobileView) return null;

        return (
            <>
                {/* Botão para visualizar PDF em desktop */}
                {normalizedData.pdfUrl && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<PictureAsPdfIcon />}
                            onClick={onOpenPdf}
                            sx={{
                                backgroundColor: typeColor.main,
                                '&:hover': {
                                    backgroundColor: typeColor.dark
                                },
                                borderRadius: '10px',
                                boxShadow: `0 4px 14px ${alpha(typeColor.main, 0.25)}`
                            }}
                        >
                            Visualizar PDF Completo
                        </Button>
                    </Box>
                )}

                {/* Tabs para navegação em desktop */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs
                        value={currentTab}
                        onChange={handleTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        sx={{
                            '& .MuiTab-root': {
                                fontWeight: 600,
                                color: theme.palette.grey[600],
                                textTransform: 'none',
                                minHeight: '48px',
                                fontSize: '0.95rem',
                                '&.Mui-selected': {
                                    color: typeColor.main,
                                }
                            },
                            '& .MuiTabs-indicator': {
                                backgroundColor: typeColor.main,
                                height: '3px',
                                borderRadius: '3px 3px 0 0'
                            }
                        }}
                    >
                        <Tab label="Queixa e Diagnóstico" icon={<MedicalInformationIcon />} iconPosition="start" />
                        <Tab label="Exame Físico" icon={<AccessibilityNewIcon />} iconPosition="start" />
                        <Tab label="Histórico" icon={<HistoryEduIcon />} iconPosition="start" />
                        <Tab label="Hábitos" icon={<LunchDiningIcon />} iconPosition="start" />
                    </Tabs>
                </Box>
            </>
        );
    };

    // Cabeçalho
    const renderHeader = () => (
        <Paper sx={{
            p: 3,
            mb: 3,
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${alpha(typeColor.main, 0.15)} 0%, ${alpha(typeColor.main, 0.05)} 100%)`,
            border: `1px solid ${alpha(typeColor.main, 0.2)}`,
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Banner de fundo */}
            <Box sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '150px',
                height: '150px',
                opacity: 0.05,
                transform: 'translate(30%, -30%)',
                display: { xs: 'none', md: 'block' }
            }}>
                <HistoryEduIcon sx={{ width: '100%', height: '100%', color: typeColor.main }} />
            </Box>

            <Box sx={{ position: 'relative', zIndex: 1 }}>
                {/* Título e data */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar sx={{
                        backgroundColor: typeColor.main,
                        color: 'white',
                        width: 48,
                        height: 48,
                        mr: 2
                    }}>
                        <HistoryEduIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: typeColor.dark, lineHeight: 1.2 }}>
                            Anamnese Clínica
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {normalizedData.createdAt ? `Realizada em ${formatDate(normalizedData.createdAt)}` : "Data não disponível"}
                        </Typography>
                    </Box>
                </Box>

                {/* Queixa principal resumida */}
                {normalizedData.chiefComplaint && (
                    <Box sx={{ mt: 2, pl: { xs: 0, sm: 7 } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <FormatQuoteIcon sx={{ color: typeColor.main, fontSize: 20, mr: 0.5, transform: 'rotate(180deg)' }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: typeColor.main }}>
                                Queixa Principal
                            </Typography>
                        </Box>
                        <Typography
                            variant="body2"
                            sx={{
                                fontStyle: 'italic',
                                color: theme.palette.grey[700],
                                backgroundColor: alpha(typeColor.main, 0.05),
                                p: 1.5,
                                borderRadius: '8px',
                                borderLeft: `3px solid ${typeColor.main}`,
                                ml: 0.5
                            }}
                        >
                            {normalizedData.chiefComplaint.length > 120
                                ? `${normalizedData.chiefComplaint.substring(0, 120)}...`
                                : normalizedData.chiefComplaint
                            }
                        </Typography>
                    </Box>
                )}

                {/* Badges informativos */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', mt: 2 }}>
                    <Chip
                        icon={<AutoAwesomeIcon />}
                        label="Visualização"
                        size="small"
                        sx={{
                            mr: 1,
                            mb: 1,
                            fontWeight: 500,
                            backgroundColor: alpha(typeColor.main, 0.1),
                            color: typeColor.main
                        }}
                    />

                    {normalizedData.lastModified && (
                        <Chip
                            icon={<EventIcon />}
                            label={`Atualizado ${formatTimeAgo(normalizedData.lastModified)}`}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1, mb: 1, fontWeight: 500 }}
                        />
                    )}

                    {normalizedData.consultationDate && (
                        <Chip
                            icon={<CalendarTodayIcon />}
                            label={`Consulta: ${formatDate(normalizedData.consultationDate)}`}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 1, mb: 1, fontWeight: 500 }}
                        />
                    )}
                </Box>
            </Box>
        </Paper>
    );

    return (
        <Box sx={{
            mt: 2,
            pb: mobileView ? 8 : 2 // Espaço para navegação mobile
        }}>
            {/* Cabeçalho da anamnese */}
            {renderHeader()}

            {/* Elementos para desktop */}
            {desktopElements()}

            {/* Conteúdo das tabs */}
            {/* TAB 1: Queixa e Diagnóstico */}
            {currentTab === 0 && (
                <Fade in={currentTab === 0}>
                    <Box>
                        {/* Queixa principal */}
                        {renderTextSection("Queixa Principal", normalizedData.chiefComplaint, <MedicalServicesIcon fontSize="small" />)}

                        {/* História da doença atual */}
                        {renderTextSection("História da Doença Atual", normalizedData.illnessHistory, <HealingIcon fontSize="small" />)}

                        {/* Diagnóstico */}
                        {renderTextSection("Diagnóstico", normalizedData.diagnosis, <LocalHospitalIcon fontSize="small" />, "#EF4444")}

                        {/* Plano de tratamento */}
                        {renderTextSection("Plano de Tratamento", normalizedData.treatmentPlan, <NoteAltIcon fontSize="small" />, "#22C55E")}

                        {/* Observações adicionais */}
                        {normalizedData.additionalNotes && renderTextSection("Observações Adicionais", normalizedData.additionalNotes, <MoreHorizIcon fontSize="small" />)}
                    </Box>
                </Fade>
            )}

            {/* TAB 2: Exame Físico */}
            {currentTab === 1 && (
                <Fade in={currentTab === 1}>
                    <Box>
                        {/* Aparência geral */}
                        {renderTextSection("Aparência Geral", normalizedData.physicalExam?.generalAppearance, <AccessibilityNewIcon fontSize="small" />)}

                        {/* Sinais vitais */}
                        {normalizedData.physicalExam?.vitalSigns && Object.values(normalizedData.physicalExam.vitalSigns).some(value => value) && (
                            <Box sx={{ mt: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Avatar
                                        sx={{
                                            backgroundColor: alpha("#3366FF", 0.1),
                                            color: "#3366FF",
                                            width: 32,
                                            height: 32,
                                            mr: 1
                                        }}
                                    >
                                        <MonitorHeartIcon fontSize="small" />
                                    </Avatar>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#3366FF" }}>
                                        Sinais Vitais
                                    </Typography>
                                </Box>

                                <Grid container spacing={2}>
                                    {renderVitalSign(
                                        <MonitorHeartIcon />,
                                        "Pressão Arterial",
                                        normalizedData.physicalExam.vitalSigns.bloodPressure,
                                        "mmHg",
                                        "#3366FF"
                                    )}

                                    {renderVitalSign(
                                        <FavoriteIcon />,
                                        "Freq. Cardíaca",
                                        normalizedData.physicalExam.vitalSigns.heartRate,
                                        "bpm",
                                        "#F50057"
                                    )}

                                    {renderVitalSign(
                                        <ThermostatIcon />,
                                        "Temperatura",
                                        normalizedData.physicalExam.vitalSigns.temperature,
                                        "°C",
                                        "#FF6D00"
                                    )}

                                    {renderVitalSign(
                                        <SpeedIcon />,
                                        "Freq. Respiratória",
                                        normalizedData.physicalExam.vitalSigns.respiratoryRate,
                                        "irpm",
                                        "#00BFA5"
                                    )}

                                    {renderVitalSign(
                                        <BubbleChartIcon />,
                                        "Saturação O₂",
                                        normalizedData.physicalExam.vitalSigns.oxygenSaturation,
                                        "%",
                                        "#651FFF"
                                    )}
                                </Grid>
                            </Box>
                        )}

                        {/* Sistemas do exame físico */}
                        {normalizedData.physicalExam && (
                            <Box sx={{ mt: 3 }}>
                                <Grid container spacing={3}>
                                    {normalizedData.physicalExam.headAndNeck && (
                                        <Grid item xs={12} md={6}>
                                            {renderAccordionSection(
                                                "Cabeça e Pescoço",
                                                normalizedData.physicalExam.headAndNeck,
                                                <WcIcon fontSize="small" />,
                                                false,
                                                "#F59E0B"
                                            )}
                                        </Grid>
                                    )}

                                    {normalizedData.physicalExam.cardiovascular && (
                                        <Grid item xs={12} md={6}>
                                            {renderAccordionSection(
                                                "Cardiovascular",
                                                normalizedData.physicalExam.cardiovascular,
                                                <FavoriteIcon fontSize="small" />,
                                                false,
                                                "#F50057"
                                            )}
                                        </Grid>
                                    )}

                                    {normalizedData.physicalExam.respiratory && (
                                        <Grid item xs={12} md={6}>
                                            {renderAccordionSection(
                                                "Respiratório",
                                                normalizedData.physicalExam.respiratory,
                                                <AirIcon fontSize="small" />,
                                                false,
                                                "#00BFA5"
                                            )}
                                        </Grid>
                                    )}

                                    {normalizedData.physicalExam.abdomen && (
                                        <Grid item xs={12} md={6}>
                                            {renderAccordionSection(
                                                "Abdômen",
                                                normalizedData.physicalExam.abdomen,
                                                <RestaurantIcon fontSize="small" />,
                                                false,
                                                "#F59E0B"
                                            )}
                                        </Grid>
                                    )}

                                    {normalizedData.physicalExam.extremities && (
                                        <Grid item xs={12} md={6}>
                                            {renderAccordionSection(
                                                "Extremidades",
                                                normalizedData.physicalExam.extremities,
                                                <AccessibilityNewIcon fontSize="small" />,
                                                false,
                                                "#3B82F6"
                                            )}
                                        </Grid>
                                    )}

                                    {normalizedData.physicalExam.neurological && (
                                        <Grid item xs={12} md={6}>
                                            {renderAccordionSection(
                                                "Neurológico",
                                                normalizedData.physicalExam.neurological,
                                                <BrainIcon fontSize="small" />,
                                                false,
                                                "#8B5CF6"
                                            )}
                                        </Grid>
                                    )}

                                    {normalizedData.physicalExam.other && (
                                        <Grid item xs={12}>
                                            {renderAccordionSection(
                                                "Outras Observações",
                                                normalizedData.physicalExam.other,
                                                <NoteAltIcon fontSize="small" />
                                            )}
                                        </Grid>
                                    )}
                                </Grid>
                            </Box>
                        )}

                        {/* Revisão de sistemas */}
                        {normalizedData.systemsReview && Object.values(normalizedData.systemsReview).some(value => value) && (
                            <Box sx={{ mt: 4 }}>
                                <Paper sx={{
                                    p: 3,
                                    borderRadius: '16px',
                                    mb: 3,
                                    backgroundColor: alpha(typeColor.main, 0.03),
                                    border: `1px solid ${alpha(typeColor.main, 0.1)}`
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <FilterListIcon sx={{ color: typeColor.main, mr: 1 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: typeColor.dark }}>
                                            Revisão de Sistemas
                                        </Typography>
                                    </Box>

                                    <Divider sx={{ mb: 3 }} />

                                    <Grid container spacing={3}>
                                        {normalizedData.systemsReview.cardiovascular && (
                                            <Grid item xs={12} md={6}>
                                                {renderAccordionSection(
                                                    "Cardiovascular",
                                                    normalizedData.systemsReview.cardiovascular,
                                                    <FavoriteIcon fontSize="small" />,
                                                    false,
                                                    "#F50057"
                                                )}
                                            </Grid>
                                        )}

                                        {normalizedData.systemsReview.respiratory && (
                                            <Grid item xs={12} md={6}>
                                                {renderAccordionSection(
                                                    "Respiratório",
                                                    normalizedData.systemsReview.respiratory,
                                                    <AirIcon fontSize="small" />,
                                                    false,
                                                    "#00BFA5"
                                                )}
                                            </Grid>
                                        )}

                                        {normalizedData.systemsReview.gastrointestinal && (
                                            <Grid item xs={12} md={6}>
                                                {renderAccordionSection(
                                                    "Gastrointestinal",
                                                    normalizedData.systemsReview.gastrointestinal,
                                                    <RestaurantIcon fontSize="small" />,
                                                    false,
                                                    "#F59E0B"
                                                )}
                                            </Grid>
                                        )}

                                        {normalizedData.systemsReview.genitourinary && (
                                            <Grid item xs={12} md={6}>
                                                {renderAccordionSection(
                                                    "Geniturinário",
                                                    normalizedData.systemsReview.genitourinary,
                                                    <WcIcon fontSize="small" />,
                                                    false,
                                                    "#3B82F6"
                                                )}
                                            </Grid>
                                        )}

                                        {normalizedData.systemsReview.neurological && (
                                            <Grid item xs={12} md={6}>
                                                {renderAccordionSection(
                                                    "Neurológico",
                                                    normalizedData.systemsReview.neurological,
                                                    <BrainIcon fontSize="small" />,
                                                    false,
                                                    "#8B5CF6"
                                                )}
                                            </Grid>
                                        )}

                                        {normalizedData.systemsReview.musculoskeletal && (
                                            <Grid item xs={12} md={6}>
                                                {renderAccordionSection(
                                                    "Musculoesquelético",
                                                    normalizedData.systemsReview.musculoskeletal,
                                                    <AccessibilityNewIcon fontSize="small" />,
                                                    false,
                                                    "#3B82F6"
                                                )}
                                            </Grid>
                                        )}

                                        {normalizedData.systemsReview.endocrine && (
                                            <Grid item xs={12} md={6}>
                                                {renderAccordionSection(
                                                    "Endócrino",
                                                    normalizedData.systemsReview.endocrine,
                                                    <CoronavirusIcon fontSize="small" />,
                                                    false,
                                                    "#10B981"
                                                )}
                                            </Grid>
                                        )}

                                        {normalizedData.systemsReview.hematologic && (
                                            <Grid item xs={12} md={6}>
                                                {renderAccordionSection(
                                                    "Hematológico",
                                                    normalizedData.systemsReview.hematologic,
                                                    <LocalHospitalIcon fontSize="small" />,
                                                    false,
                                                    "#EF4444"
                                                )}
                                            </Grid>
                                        )}

                                        {normalizedData.systemsReview.psychiatric && (
                                            <Grid item xs={12} md={6}>
                                                {renderAccordionSection(
                                                    "Psiquiátrico",
                                                    normalizedData.systemsReview.psychiatric,
                                                    <PsychologyIcon fontSize="small" />,
                                                    false,
                                                    "#8B5CF6"
                                                )}
                                            </Grid>
                                        )}

                                        {normalizedData.systemsReview.dermatological && (
                                            <Grid item xs={12} md={6}>
                                                {renderAccordionSection(
                                                    "Dermatológico",
                                                    normalizedData.systemsReview.dermatological,
                                                    <AccessibilityNewIcon fontSize="small" />,
                                                    false,
                                                    "#F59E0B"
                                                )}
                                            </Grid>
                                        )}
                                    </Grid>
                                </Paper>
                            </Box>
                        )}
                    </Box>
                </Fade>
            )}

            {/* TAB 3: Histórico */}
            {currentTab === 2 && (
                <Fade in={currentTab === 2}>
                    <Box>
                        {/* Grid de 4 cartas coloridas para resumo */}
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            {/* Condições médicas */}
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper sx={{
                                    p: 2,
                                    height: '100%',
                                    borderRadius: '12px',
                                    border: '1px solid #EAECEF',
                                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mb: 1,
                                        pb: 1,
                                        borderBottom: '1px dashed #EAECEF'
                                    }}>
                                        <Avatar sx={{ bgcolor: '#EF4444', width: 30, height: 30, mr: 1 }}>
                                            <MedicalInformationIcon fontSize="small" />
                                        </Avatar>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            Condições Médicas
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" sx={{ color: '#EF4444', fontWeight: 600, mb: 1 }}>
                                            {normalizedData.medicalHistory ? normalizedData.medicalHistory.length : 0}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {normalizedData.medicalHistory && normalizedData.medicalHistory.length > 0
                                                ? 'Condições registradas'
                                                : 'Nenhuma condição registrada'}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>

                            {/* Cirurgias */}
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper sx={{
                                    p: 2,
                                    height: '100%',
                                    borderRadius: '12px',
                                    border: '1px solid #EAECEF',
                                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mb: 1,
                                        pb: 1,
                                        borderBottom: '1px dashed #EAECEF'
                                    }}>
                                        <Avatar sx={{ bgcolor: '#8B5CF6', width: 30, height: 30, mr: 1 }}>
                                            <AirlineSeatFlatIcon fontSize="small" />
                                        </Avatar>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            Cirurgias
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" sx={{ color: '#8B5CF6', fontWeight: 600, mb: 1 }}>
                                            {normalizedData.surgicalHistory ? normalizedData.surgicalHistory.length : 0}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {normalizedData.surgicalHistory && normalizedData.surgicalHistory.length > 0
                                                ? 'Cirurgias registradas'
                                                : 'Nenhuma cirurgia registrada'}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>

                            {/* Medicamentos */}
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper sx={{
                                    p: 2,
                                    height: '100%',
                                    borderRadius: '12px',
                                    border: '1px solid #EAECEF',
                                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mb: 1,
                                        pb: 1,
                                        borderBottom: '1px dashed #EAECEF'
                                    }}>
                                        <Avatar sx={{ bgcolor: '#22C55E', width: 30, height: 30, mr: 1 }}>
                                            <MedicationIcon fontSize="small" />
                                        </Avatar>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            Medicamentos
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" sx={{ color: '#22C55E', fontWeight: 600, mb: 1 }}>
                                            {normalizedData.currentMedications ? normalizedData.currentMedications.length : 0}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {normalizedData.currentMedications && normalizedData.currentMedications.length > 0
                                                ? 'Medicamentos em uso'
                                                : 'Nenhum medicamento em uso'}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>

                            {/* Alergias */}
                            <Grid item xs={12} sm={6} md={3}>
                                <Paper sx={{
                                    p: 2,
                                    height: '100%',
                                    borderRadius: '12px',
                                    border: '1px solid #EAECEF',
                                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mb: 1,
                                        pb: 1,
                                        borderBottom: '1px dashed #EAECEF'
                                    }}>
                                        <Avatar sx={{ bgcolor: '#F59E0B', width: 30, height: 30, mr: 1 }}>
                                            <NightlifeIcon fontSize="small" />
                                        </Avatar>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            Alergias
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="h6" sx={{ color: '#F59E0B', fontWeight: 600, mb: 1 }}>
                                            {normalizedData.allergies ? normalizedData.allergies.length : 0}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {normalizedData.allergies && normalizedData.allergies.length > 0
                                                ? 'Alergias registradas'
                                                : 'Nenhuma alergia registrada'}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>

                        {/* Histórico médico */}
                        <Box sx={{ mt: 2 }}>
                            {renderAccordionSection(
                                "Histórico Médico",
                                <Box>
                                    {renderItemList(normalizedData.medicalHistory, "Nenhuma condição médica prévia registrada", "#EF4444")}
                                </Box>,
                                <MedicalInformationIcon fontSize="small" />,
                                true,
                                "#EF4444"
                            )}
                        </Box>

                        {/* Histórico cirúrgico */}
                        <Box sx={{ mt: 2 }}>
                            {renderAccordionSection(
                                "Histórico Cirúrgico",
                                <Box>
                                    {renderItemList(normalizedData.surgicalHistory, "Nenhuma cirurgia prévia registrada", "#8B5CF6")}
                                </Box>,
                                <AirlineSeatFlatIcon fontSize="small" />,
                                true,
                                "#8B5CF6"
                            )}
                        </Box>

                        {/* Medicamentos em uso */}
                        <Box sx={{ mt: 2 }}>
                            {renderAccordionSection(
                                "Medicamentos em Uso",
                                <Box>
                                    {renderItemList(normalizedData.currentMedications, "Nenhum medicamento em uso registrado", "#22C55E")}
                                </Box>,
                                <MedicationIcon fontSize="small" />,
                                true,
                                "#22C55E"
                            )}
                        </Box>

                        {/* Alergias */}
                        <Box sx={{ mt: 2 }}>
                            {renderAccordionSection(
                                "Alergias",
                                <Box>
                                    {renderItemList(normalizedData.allergies, "Nenhuma alergia registrada", "#F59E0B")}
                                </Box>,
                                <NightlifeIcon fontSize="small" />,
                                true,
                                "#F59E0B"
                            )}
                        </Box>

                        {/* Histórico familiar */}
                        {normalizedData.familyHistory &&
                            renderAccordionSection(
                                "Histórico Familiar",
                                normalizedData.familyHistory,
                                <FamilyRestroomIcon fontSize="small" />,
                                true,
                                "#3B82F6"
                            )
                        }
                    </Box>
                </Fade>
            )}

            {/* TAB 4: Hábitos de Vida */}
            {currentTab === 3 && (
                <Fade in={currentTab === 3}>
                    <Box>
                        {normalizedData.socialHistory && (
                            <>
                                {/* Tabagismo */}
                                <Paper sx={{
                                    p: 2.5,
                                    mb: 3,
                                    borderRadius: '12px',
                                    border: '1px solid #EAECEF',
                                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Avatar
                                            sx={{
                                                backgroundColor: alpha('#F59E0B', 0.1),
                                                color: '#F59E0B',
                                                width: 32,
                                                height: 32,
                                                mr: 1.5
                                            }}
                                        >
                                            <SmokingRoomsIcon fontSize="small" />
                                        </Avatar>
                                        <Typography variant="h6" sx={{ fontWeight: 600, mr: 2 }}>
                                            Tabagismo
                                        </Typography>
                                        {normalizedData.socialHistory.isSmoker !== undefined && (
                                            <Chip
                                                icon={normalizedData.socialHistory.isSmoker ? <CheckCircleIcon /> : <CancelIcon />}
                                                label={normalizedData.socialHistory.isSmoker ? "Sim" : "Não"}
                                                color={normalizedData.socialHistory.isSmoker ? "error" : "success"}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        )}
                                    </Box>

                                    {normalizedData.socialHistory.isSmoker && normalizedData.socialHistory.cigarettesPerDay > 0 && (
                                        <Box sx={{
                                            pl: 6,
                                            mt: 2,
                                            p: 2,
                                            borderRadius: '8px',
                                            backgroundColor: alpha('#F59E0B', 0.05),
                                            border: `1px solid ${alpha('#F59E0B', 0.1)}`
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="textSecondary">
                                                    Quantidade diária:
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#F59E0B' }}>
                                                    {normalizedData.socialHistory.cigarettesPerDay} cigarros
                                                </Typography>
                                            </Box>

                                            {/* Gráfico simplificado */}
                                            <Box sx={{ mt: 2, width: '100%', height: '10px', backgroundColor: '#E5E7EB', borderRadius: '5px' }}>
                                                <Box
                                                    sx={{
                                                        height: '100%',
                                                        backgroundColor: '#F59E0B',
                                                        borderRadius: '5px',
                                                        width: `${Math.min(100, (normalizedData.socialHistory.cigarettesPerDay / 40) * 100)}%`
                                                    }}
                                                />
                                            </Box>
                                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, textAlign: 'right', color: '#9CA3AF' }}>
                                                0 - 40 cigarros/dia
                                            </Typography>
                                        </Box>
                                    )}
                                </Paper>

                                {/* Consumo de álcool */}
                                <Paper sx={{
                                    p: 2.5,
                                    mb: 3,
                                    borderRadius: '12px',
                                    border: '1px solid #EAECEF',
                                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Avatar
                                            sx={{
                                                backgroundColor: alpha('#7C3AED', 0.1),
                                                color: '#7C3AED',
                                                width: 32,
                                                height: 32,
                                                mr: 1.5
                                            }}
                                        >
                                            <LocalBarIcon fontSize="small" />
                                        </Avatar>
                                        <Typography variant="h6" sx={{ fontWeight: 600, mr: 2 }}>
                                            Consumo de Álcool
                                        </Typography>
                                        {normalizedData.socialHistory.isAlcoholConsumer !== undefined && (
                                            <Chip
                                                icon={normalizedData.socialHistory.isAlcoholConsumer ? <CheckCircleIcon /> : <CancelIcon />}
                                                label={normalizedData.socialHistory.isAlcoholConsumer ? "Sim" : "Não"}
                                                color={normalizedData.socialHistory.isAlcoholConsumer ? "warning" : "success"}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        )}
                                    </Box>

                                    {normalizedData.socialHistory.isAlcoholConsumer && normalizedData.socialHistory.alcoholFrequency && (
                                        <Box sx={{
                                            pl: 6,
                                            mt: 2,
                                            p: 2,
                                            borderRadius: '8px',
                                            backgroundColor: alpha('#7C3AED', 0.05),
                                            border: `1px solid ${alpha('#7C3AED', 0.1)}`
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="textSecondary">
                                                    Frequência:
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#7C3AED' }}>
                                                    {normalizedData.socialHistory.alcoholFrequency}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                </Paper>

                                {/* Uso de outras substâncias */}
                                <Paper sx={{
                                    p: 2.5,
                                    mb: 3,
                                    borderRadius: '12px',
                                    border: '1px solid #EAECEF',
                                    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Avatar
                                            sx={{
                                                backgroundColor: alpha('#EF4444', 0.1),
                                                color: '#EF4444',
                                                width: 32,
                                                height: 32,
                                                mr: 1.5
                                            }}
                                        >
                                            <NightlifeIcon fontSize="small" />
                                        </Avatar>
                                        <Typography variant="h6" sx={{ fontWeight: 600, mr: 2 }}>
                                            Uso de Outras Substâncias
                                        </Typography>
                                        {normalizedData.socialHistory.isDrugUser !== undefined && (
                                            <Chip
                                                icon={normalizedData.socialHistory.isDrugUser ? <CheckCircleIcon /> : <CancelIcon />}
                                                label={normalizedData.socialHistory.isDrugUser ? "Sim" : "Não"}
                                                color={normalizedData.socialHistory.isDrugUser ? "error" : "success"}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        )}
                                    </Box>

                                    {normalizedData.socialHistory.isDrugUser && normalizedData.socialHistory.drugDetails && (
                                        <Box sx={{
                                            pl: 6,
                                            mt: 2,
                                            p: 2,
                                            borderRadius: '8px',
                                            backgroundColor: alpha('#EF4444', 0.05),
                                            border: `1px solid ${alpha('#EF4444', 0.1)}`
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Typography variant="body2" color="textSecondary">
                                                    Detalhes:
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#EF4444', textAlign: 'right', ml: 2 }}>
                                                    {normalizedData.socialHistory.drugDetails}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                </Paper>

                                {/* Grid com Atividade Física, Hábitos Alimentares e Ocupação */}
                                <Grid container spacing={3}>
                                    {normalizedData.socialHistory.physicalActivity && (
                                        <Grid item xs={12} md={4}>
                                            <Paper sx={{
                                                p: 2.5,
                                                height: '100%',
                                                borderRadius: '12px',
                                                border: '1px solid #EAECEF',
                                                boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)'
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <Avatar
                                                        sx={{
                                                            backgroundColor: alpha('#10B981', 0.1),
                                                            color: '#10B981',
                                                            width: 32,
                                                            height: 32,
                                                            mr: 1.5
                                                        }}
                                                    >
                                                        <SportsBasketballIcon fontSize="small" />
                                                    </Avatar>
                                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                        Atividade Física
                                                    </Typography>
                                                </Box>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        backgroundColor: alpha('#10B981', 0.05),
                                                        p: 2,
                                                        borderRadius: '8px',
                                                        border: `1px solid ${alpha('#10B981', 0.1)}`
                                                    }}
                                                >
                                                    {normalizedData.socialHistory.physicalActivity}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    )}

                                    {normalizedData.socialHistory.dietHabits && (
                                        <Grid item xs={12} md={4}>
                                            <Paper sx={{
                                                p: 2.5,
                                                height: '100%',
                                                borderRadius: '12px',
                                                border: '1px solid #EAECEF',
                                                boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)'
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <Avatar
                                                        sx={{
                                                            backgroundColor: alpha('#F59E0B', 0.1),
                                                            color: '#F59E0B',
                                                            width: 32,
                                                            height: 32,
                                                            mr: 1.5
                                                        }}
                                                    >
                                                        <RestaurantIcon fontSize="small" />
                                                    </Avatar>
                                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                        Hábitos Alimentares
                                                    </Typography>
                                                </Box>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        backgroundColor: alpha('#F59E0B', 0.05),
                                                        p: 2,
                                                        borderRadius: '8px',
                                                        border: `1px solid ${alpha('#F59E0B', 0.1)}`
                                                    }}
                                                >
                                                    {normalizedData.socialHistory.dietHabits}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    )}

                                    {normalizedData.socialHistory.occupation && (
                                        <Grid item xs={12} md={4}>
                                            <Paper sx={{
                                                p: 2.5,
                                                height: '100%',
                                                borderRadius: '12px',
                                                border: '1px solid #EAECEF',
                                                boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)'
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <Avatar
                                                        sx={{
                                                            backgroundColor: alpha('#3B82F6', 0.1),
                                                            color: '#3B82F6',
                                                            width: 32,
                                                            height: 32,
                                                            mr: 1.5
                                                        }}
                                                    >
                                                        <WorkIcon fontSize="small" />
                                                    </Avatar>
                                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                        Ocupação
                                                    </Typography>
                                                </Box>
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        backgroundColor: alpha('#3B82F6', 0.05),
                                                        p: 2,
                                                        borderRadius: '8px',
                                                        border: `1px solid ${alpha('#3B82F6', 0.1)}`
                                                    }}
                                                >
                                                    {normalizedData.socialHistory.occupation}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    )}
                                </Grid>
                            </>
                        )}
                    </Box>
                </Fade>
            )}

            {/* Navegação Mobile */}
            {mobileView && renderMobileNavigation()}
        </Box>
    );
};

export default AnamneseViewer;