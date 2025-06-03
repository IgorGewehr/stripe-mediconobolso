import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Divider,
    Chip,
    Button,
    CircularProgress,
    useTheme,
    alpha,
    Paper,
    Grid
} from "@mui/material";

// Ícones
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import SpeedIcon from "@mui/icons-material/Speed";
import BubbleChartIcon from "@mui/icons-material/BubbleChart";
import MedicationIcon from "@mui/icons-material/Medication";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import MedicalInformationIcon from "@mui/icons-material/MedicalInformation";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import SmokingRoomsIcon from "@mui/icons-material/SmokingRooms";
import LocalBarIcon from "@mui/icons-material/LocalBar";
import SportsBasketballIcon from "@mui/icons-material/SportsBasketball";
import NightlifeIcon from "@mui/icons-material/Nightlife";
import PsychologyIcon from "@mui/icons-material/Psychology";
import CoronavirusIcon from "@mui/icons-material/Coronavirus";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import AirlineSeatFlatIcon from "@mui/icons-material/AirlineSeatFlat";
import AirIcon from "@mui/icons-material/Air";
import WcIcon from "@mui/icons-material/Wc";
import HealingIcon from "@mui/icons-material/Healing";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import NoteAltIcon from "@mui/icons-material/NoteAlt";
import WorkIcon from "@mui/icons-material/Work";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";

// Formatação de data
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Serviço Firebase
import FirebaseService from "../../../lib/firebaseService";

const AnamneseViewer = ({ anamneseData, typeColor, onOpenPdf }) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [normalizedData, setNormalizedData] = useState(null);

    // Efeito para normalizar os dados da anamnese
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

    // Função para formatar datas
    const formatDate = (date) => {
        if (!date) return "";
        const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
        return format(dateObj, "dd/MM/yyyy", { locale: ptBR });
    };

    // Verifica se há dados para exibir
    if (loading || !normalizedData) {
        return (
            <Box sx={{ py: 2, textAlign: 'center' }}>
                <CircularProgress size={30} sx={{ mb: 1 }} />
                <Typography variant="body2" color="textSecondary">
                    Carregando dados...
                </Typography>
            </Box>
        );
    }

    // Função para renderizar sinais vitais de forma compacta
    const renderVitalSigns = () => {
        const vitalSigns = normalizedData.physicalExam?.vitalSigns;
        if (!vitalSigns || Object.values(vitalSigns).every(v => !v)) return null;

        return (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {vitalSigns.bloodPressure && (
                    <Chip
                        icon={<MonitorHeartIcon sx={{ fontSize: '1rem' }} />}
                        label={`PA: ${vitalSigns.bloodPressure} mmHg`}
                        size="small"
                        sx={{ bgcolor: alpha('#3366FF', 0.1) }}
                    />
                )}

                {vitalSigns.heartRate && (
                    <Chip
                        icon={<FavoriteIcon sx={{ fontSize: '1rem' }} />}
                        label={`FC: ${vitalSigns.heartRate} bpm`}
                        size="small"
                        sx={{ bgcolor: alpha('#F50057', 0.1) }}
                    />
                )}

                {vitalSigns.temperature && (
                    <Chip
                        icon={<ThermostatIcon sx={{ fontSize: '1rem' }} />}
                        label={`Temp: ${vitalSigns.temperature} °C`}
                        size="small"
                        sx={{ bgcolor: alpha('#FF6D00', 0.1) }}
                    />
                )}

                {vitalSigns.respiratoryRate && (
                    <Chip
                        icon={<SpeedIcon sx={{ fontSize: '1rem' }} />}
                        label={`FR: ${vitalSigns.respiratoryRate} irpm`}
                        size="small"
                        sx={{ bgcolor: alpha('#00BFA5', 0.1) }}
                    />
                )}

                {vitalSigns.oxygenSaturation && (
                    <Chip
                        icon={<BubbleChartIcon sx={{ fontSize: '1rem' }} />}
                        label={`SatO₂: ${vitalSigns.oxygenSaturation}%`}
                        size="small"
                        sx={{ bgcolor: alpha('#651FFF', 0.1) }}
                    />
                )}
            </Box>
        );
    };

    // Função para renderizar lista de itens com chips
    const renderItemList = (items, emptyMessage = "Nenhum item registrado") => {
        if (!items || items.length === 0) {
            return (
                <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                    {emptyMessage}
                </Typography>
            );
        }

        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {items.map((item, index) => (
                    <Chip
                        key={index}
                        label={item}
                        size="small"
                        sx={{
                            bgcolor: alpha(typeColor.main, 0.1),
                            color: theme.palette.text.primary,
                            fontWeight: 400,
                        }}
                    />
                ))}
            </Box>
        );
    };

    // Função para renderizar seção de hábitos de vida
    const renderSocialHistory = () => {
        const socialHistory = normalizedData.socialHistory;
        if (!socialHistory) return null;

        return (
            <Grid container spacing={2} sx={{ mt: 1 }}>
                {/* Tabagismo */}
                {socialHistory.isSmoker !== undefined && (
                    <Grid item xs={12} md={6}>
                        <Paper elevation={1} sx={{
                            p: 2,
                            height: '100%',
                            borderRadius: '8px',
                            borderLeft: `4px solid #F59E0B`,
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <SmokingRoomsIcon sx={{ color: '#F59E0B', mr: 1 }} />
                                <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                                    Tabagismo
                                </Typography>
                            </Box>
                            <Typography variant="body1" sx={{
                                fontWeight: 500,
                                color: socialHistory.isSmoker ? '#EF4444' : '#10B981'
                            }}>
                                {socialHistory.isSmoker ? 'Sim' : 'Não'}
                            </Typography>
                            {socialHistory.isSmoker && socialHistory.cigarettesPerDay > 0 && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    {socialHistory.cigarettesPerDay} cigarros por dia
                                </Typography>
                            )}
                        </Paper>
                    </Grid>
                )}

                {/* Consumo de álcool */}
                {socialHistory.isAlcoholConsumer !== undefined && (
                    <Grid item xs={12} md={6}>
                        <Paper elevation={1} sx={{
                            p: 2,
                            height: '100%',
                            borderRadius: '8px',
                            borderLeft: `4px solid #7C3AED`,
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <LocalBarIcon sx={{ color: '#7C3AED', mr: 1 }} />
                                <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                                    Consumo de álcool
                                </Typography>
                            </Box>
                            <Typography variant="body1" sx={{
                                fontWeight: 500,
                                color: socialHistory.isAlcoholConsumer ? '#F59E0B' : '#10B981'
                            }}>
                                {socialHistory.isAlcoholConsumer ? 'Sim' : 'Não'}
                            </Typography>
                            {socialHistory.isAlcoholConsumer && socialHistory.alcoholFrequency && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    Frequência: {socialHistory.alcoholFrequency}
                                </Typography>
                            )}
                        </Paper>
                    </Grid>
                )}

                {/* Uso de outras substâncias */}
                {socialHistory.isDrugUser !== undefined && (
                    <Grid item xs={12} md={6}>
                        <Paper elevation={1} sx={{
                            p: 2,
                            height: '100%',
                            borderRadius: '8px',
                            borderLeft: `4px solid #EF4444`,
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <NightlifeIcon sx={{ color: '#EF4444', mr: 1 }} />
                                <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                                    Uso de outras substâncias
                                </Typography>
                            </Box>
                            <Typography variant="body1" sx={{
                                fontWeight: 500,
                                color: socialHistory.isDrugUser ? '#EF4444' : '#10B981'
                            }}>
                                {socialHistory.isDrugUser ? 'Sim' : 'Não'}
                            </Typography>
                            {socialHistory.isDrugUser && socialHistory.drugDetails && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    Detalhes: {socialHistory.drugDetails}
                                </Typography>
                            )}
                        </Paper>
                    </Grid>
                )}

                {/* Atividade Física */}
                {socialHistory.physicalActivity && (
                    <Grid item xs={12} md={6}>
                        <Paper elevation={1} sx={{
                            p: 2,
                            height: '100%',
                            borderRadius: '8px',
                            borderLeft: `4px solid #10B981`,
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <SportsBasketballIcon sx={{ color: '#10B981', mr: 1 }} />
                                <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                                    Atividade Física
                                </Typography>
                            </Box>
                            <Typography variant="body2">
                                {socialHistory.physicalActivity}
                            </Typography>
                        </Paper>
                    </Grid>
                )}

                {/* Hábitos Alimentares */}
                {socialHistory.dietHabits && (
                    <Grid item xs={12} md={6}>
                        <Paper elevation={1} sx={{
                            p: 2,
                            height: '100%',
                            borderRadius: '8px',
                            borderLeft: `4px solid #F59E0B`,
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <RestaurantIcon sx={{ color: '#F59E0B', mr: 1 }} />
                                <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                                    Hábitos Alimentares
                                </Typography>
                            </Box>
                            <Typography variant="body2">
                                {socialHistory.dietHabits}
                            </Typography>
                        </Paper>
                    </Grid>
                )}

                {/* Ocupação */}
                {socialHistory.occupation && (
                    <Grid item xs={12} md={6}>
                        <Paper elevation={1} sx={{
                            p: 2,
                            height: '100%',
                            borderRadius: '8px',
                            borderLeft: `4px solid #3B82F6`,
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <WorkIcon sx={{ color: '#3B82F6', mr: 1 }} />
                                <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                                    Ocupação
                                </Typography>
                            </Box>
                            <Typography variant="body2">
                                {socialHistory.occupation}
                            </Typography>
                        </Paper>
                    </Grid>
                )}
            </Grid>
        );
    };

    // Função para renderizar seção de revisão de sistemas
    const renderSystemsReview = () => {
        const systemsReview = normalizedData.systemsReview;
        if (!systemsReview || !Object.values(systemsReview).some(value => value)) return null;

        const systems = [
            { name: 'Cardiovascular', value: systemsReview.cardiovascular, icon: <FavoriteIcon sx={{ color: '#F50057', mr: 1 }} />, color: '#F50057' },
            { name: 'Respiratório', value: systemsReview.respiratory, icon: <AirIcon sx={{ color: '#00BFA5', mr: 1 }} />, color: '#00BFA5' },
            { name: 'Gastrointestinal', value: systemsReview.gastrointestinal, icon: <RestaurantIcon sx={{ color: '#F59E0B', mr: 1 }} />, color: '#F59E0B' },
            { name: 'Geniturinário', value: systemsReview.genitourinary, icon: <WcIcon sx={{ color: '#3B82F6', mr: 1 }} />, color: '#3B82F6' },
            { name: 'Neurológico', value: systemsReview.neurological, icon: <PsychologyIcon sx={{ color: '#8B5CF6', mr: 1 }} />, color: '#8B5CF6' },
            { name: 'Musculoesquelético', value: systemsReview.musculoskeletal, icon: <AccessibilityNewIcon sx={{ color: '#3B82F6', mr: 1 }} />, color: '#3B82F6' },
            { name: 'Endócrino', value: systemsReview.endocrine, icon: <CoronavirusIcon sx={{ color: '#10B981', mr: 1 }} />, color: '#10B981' },
            { name: 'Hematológico', value: systemsReview.hematologic, icon: <LocalHospitalIcon sx={{ color: '#EF4444', mr: 1 }} />, color: '#EF4444' },
            { name: 'Psiquiátrico', value: systemsReview.psychiatric, icon: <PsychologyIcon sx={{ color: '#8B5CF6', mr: 1 }} />, color: '#8B5CF6' },
            { name: 'Dermatológico', value: systemsReview.dermatological, icon: <AccessibilityNewIcon sx={{ color: '#F59E0B', mr: 1 }} />, color: '#F59E0B' }
        ];

        const filteredSystems = systems.filter(s => s.value);

        return (
            <Grid container spacing={2} sx={{ mt: 1 }}>
                {filteredSystems.map((system, index) => (
                    <Grid item xs={12} md={6} key={index}>
                        <Paper elevation={1} sx={{
                            p: 2,
                            height: '100%',
                            borderRadius: '8px',
                            borderLeft: `4px solid ${system.color}`,
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                {system.icon}
                                <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                                    {system.name}
                                </Typography>
                            </Box>
                            <Typography variant="body2">
                                {system.value}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        );
    };

    // Função para renderizar seção de exame físico
    const renderPhysicalExam = () => {
        const physicalExam = normalizedData.physicalExam;
        if (!physicalExam) return null;

        const examParts = [
            { name: 'Cabeça e Pescoço', value: physicalExam.headAndNeck, icon: <WcIcon sx={{ color: '#F59E0B', mr: 1 }} />, color: '#F59E0B' },
            { name: 'Cardiovascular', value: physicalExam.cardiovascular, icon: <FavoriteIcon sx={{ color: '#F50057', mr: 1 }} />, color: '#F50057' },
            { name: 'Respiratório', value: physicalExam.respiratory, icon: <AirIcon sx={{ color: '#00BFA5', mr: 1 }} />, color: '#00BFA5' },
            { name: 'Abdômen', value: physicalExam.abdomen, icon: <RestaurantIcon sx={{ color: '#F59E0B', mr: 1 }} />, color: '#F59E0B' },
            { name: 'Extremidades', value: physicalExam.extremities, icon: <AccessibilityNewIcon sx={{ color: '#3B82F6', mr: 1 }} />, color: '#3B82F6' },
            { name: 'Neurológico', value: physicalExam.neurological, icon: <PsychologyIcon sx={{ color: '#8B5CF6', mr: 1 }} />, color: '#8B5CF6' },
            { name: 'Aparência Geral', value: physicalExam.generalAppearance, icon: <AccessibilityNewIcon sx={{ color: typeColor.main, mr: 1 }} />, color: typeColor.main },
            { name: 'Outros', value: physicalExam.other, icon: <NoteAltIcon sx={{ color: typeColor.main, mr: 1 }} />, color: typeColor.main }
        ];

        const filteredExamParts = examParts.filter(part => part.value);
        const hasExamParts = filteredExamParts.length > 0;
        const hasVitalSigns = Object.values(physicalExam.vitalSigns || {}).some(v => v);

        if (!hasExamParts && !hasVitalSigns) return null;

        return (
            <Box sx={{ mt: 2 }}>
                {/* Sinais vitais */}
                {hasVitalSigns && (
                    <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: '8px' }}>
                        <Typography variant="h6" sx={{ fontWeight: 500, mb: 1, fontSize: '1.1rem' }}>
                            Sinais Vitais
                        </Typography>
                        {renderVitalSigns()}
                    </Paper>
                )}

                {/* Detalhes de partes específicas */}
                {hasExamParts && (
                    <Grid container spacing={2}>
                        {filteredExamParts.map((part, index) => (
                            <Grid item xs={12} md={6} key={index}>
                                <Paper elevation={1} sx={{
                                    p: 2,
                                    height: '100%',
                                    borderRadius: '8px',
                                    borderLeft: `4px solid ${part.color}`,
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        {part.icon}
                                        <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                                            {part.name}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2">
                                        {part.value}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>
        );
    };

    return (
        <Box sx={{ pt: 1, pb: 2, maxWidth: '900px', mx: 'auto' }}>
            {/* Queixa Principal - Em destaque */}
            <Box sx={{ mb: 4 }}>
                <Typography
                    variant="h6"
                    sx={{
                        borderBottom: `2px solid ${typeColor.main}`,
                        pb: 1,
                        mb: 3,
                        display: 'inline-block',
                        fontWeight: 500
                    }}
                >
                    Queixa Principal
                </Typography>

                <Grid container spacing={2}>
                    {normalizedData.chiefComplaint && (
                        <Grid item xs={12}>
                            <Paper elevation={1} sx={{
                                p: 2,
                                borderRadius: '8px',
                                borderLeft: `4px solid ${typeColor.main}`,
                            }}>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                    {normalizedData.chiefComplaint}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </Box>

            {/* Motivo da Consulta e Diagnóstico */}
            <Box sx={{ mb: 4 }}>
                <Typography
                    variant="h6"
                    sx={{
                        borderBottom: `2px solid ${typeColor.main}`,
                        pb: 1,
                        mb: 3,
                        display: 'inline-block',
                        fontWeight: 500
                    }}
                >
                    Motivo da Consulta e Diagnóstico
                </Typography>

                <Grid container spacing={2}>
                    {/* História da doença atual */}
                    {normalizedData.illnessHistory && (
                        <Grid item xs={12} md={6}>
                            <Paper elevation={1} sx={{
                                p: 2,
                                height: '100%',
                                borderRadius: '8px',
                                borderLeft: `4px solid ${typeColor.main}`,
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <HealingIcon sx={{ color: typeColor.main, mr: 1 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                                        História da Doença Atual
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                    {normalizedData.illnessHistory}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}

                    {/* Diagnóstico */}
                    {normalizedData.diagnosis && (
                        <Grid item xs={12} md={6}>
                            <Paper elevation={1} sx={{
                                p: 2,
                                height: '100%',
                                borderRadius: '8px',
                                borderLeft: `4px solid #EF4444`,
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <LocalHospitalIcon sx={{ color: '#EF4444', mr: 1 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                                        Diagnóstico
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                    {normalizedData.diagnosis}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}

                    {/* Plano de tratamento */}
                    {normalizedData.treatmentPlan && (
                        <Grid item xs={12}>
                            <Paper elevation={1} sx={{
                                p: 2,
                                borderRadius: '8px',
                                borderLeft: `4px solid #22C55E`,
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <NoteAltIcon sx={{ color: '#22C55E', mr: 1 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                                        Plano de Tratamento
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                    {normalizedData.treatmentPlan}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}

                    {/* Observações adicionais */}
                    {normalizedData.additionalNotes && (
                        <Grid item xs={12}>
                            <Paper elevation={1} sx={{
                                p: 2,
                                borderRadius: '8px',
                                borderLeft: `4px solid ${theme.palette.grey[500]}`,
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <NoteAltIcon sx={{ color: theme.palette.grey[500], mr: 1 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                                        Observações Adicionais
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                    {normalizedData.additionalNotes}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </Box>

            {/* Exame Físico */}
            <Box sx={{ mb: 4 }}>
                <Typography
                    variant="h6"
                    sx={{
                        borderBottom: `2px solid ${typeColor.main}`,
                        pb: 1,
                        mb: 3,
                        display: 'inline-block',
                        fontWeight: 500
                    }}
                >
                    Exame Físico
                </Typography>
                {renderPhysicalExam()}
            </Box>

            {/* Histórico */}
            <Box sx={{ mb: 4 }}>
                <Typography
                    variant="h6"
                    sx={{
                        borderBottom: `2px solid ${typeColor.main}`,
                        pb: 1,
                        mb: 3,
                        display: 'inline-block',
                        fontWeight: 500
                    }}
                >
                    Histórico
                </Typography>

                <Grid container spacing={2}>
                    {/* Histórico médico */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={1} sx={{
                            p: 2,
                            height: '100%',
                            borderRadius: '8px',
                            borderLeft: `4px solid #EF4444`,
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <MedicalInformationIcon sx={{ color: '#EF4444', mr: 1 }} />
                                <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                                    Histórico Médico
                                </Typography>
                            </Box>
                            {renderItemList(normalizedData.medicalHistory)}
                        </Paper>
                    </Grid>

                    {/* Histórico cirúrgico */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={1} sx={{
                            p: 2,
                            height: '100%',
                            borderRadius: '8px',
                            borderLeft: `4px solid #8B5CF6`,
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <AirlineSeatFlatIcon sx={{ color: '#8B5CF6', mr: 1 }} />
                                <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                                    Histórico Cirúrgico
                                </Typography>
                            </Box>
                            {renderItemList(normalizedData.surgicalHistory)}
                        </Paper>
                    </Grid>

                    {/* Medicamentos em uso */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={1} sx={{
                            p: 2,
                            height: '100%',
                            borderRadius: '8px',
                            borderLeft: `4px solid #22C55E`,
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <MedicationIcon sx={{ color: '#22C55E', mr: 1 }} />
                                <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                                    Medicamentos em Uso
                                </Typography>
                            </Box>
                            {renderItemList(normalizedData.currentMedications)}
                        </Paper>
                    </Grid>

                    {/* Alergias */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={1} sx={{
                            p: 2,
                            height: '100%',
                            borderRadius: '8px',
                            borderLeft: `4px solid #F59E0B`,
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <NightlifeIcon sx={{ color: '#F59E0B', mr: 1 }} />
                                <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                                    Alergias
                                </Typography>
                            </Box>
                            {renderItemList(normalizedData.allergies)}
                        </Paper>
                    </Grid>

                    {/* Histórico familiar */}
                    {normalizedData.familyHistory && (
                        <Grid item xs={12}>
                            <Paper elevation={1} sx={{
                                p: 2,
                                borderRadius: '8px',
                                borderLeft: `4px solid #3B82F6`,
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <FamilyRestroomIcon sx={{ color: '#3B82F6', mr: 1 }} />
                                    <Typography variant="h6" sx={{ fontWeight: 500, fontSize: '1.1rem' }}>
                                        Histórico Familiar
                                    </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                    {normalizedData.familyHistory}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </Box>

            {/* Hábitos de Vida */}
            <Box sx={{ mb: 4 }}>
                <Typography
                    variant="h6"
                    sx={{
                        borderBottom: `2px solid ${typeColor.main}`,
                        pb: 1,
                        mb: 3,
                        display: 'inline-block',
                        fontWeight: 500
                    }}
                >
                    Hábitos de Vida
                </Typography>
                {renderSocialHistory()}
            </Box>

            {/* Revisão de Sistemas */}
            <Box sx={{ mb: 4 }}>
                <Typography
                    variant="h6"
                    sx={{
                        borderBottom: `2px solid ${typeColor.main}`,
                        pb: 1,
                        mb: 3,
                        display: 'inline-block',
                        fontWeight: 500
                    }}
                >
                    Revisão de Sistemas
                </Typography>
                {renderSystemsReview()}
            </Box>
        </Box>
    );
};

export default AnamneseViewer;