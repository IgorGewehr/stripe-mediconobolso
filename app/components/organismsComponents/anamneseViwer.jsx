import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Divider,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Button,
    CircularProgress,
    useTheme,
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
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import HealingIcon from "@mui/icons-material/Healing";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import NoteAltIcon from "@mui/icons-material/NoteAlt";
import WorkIcon from "@mui/icons-material/Work";

// Formatação de data
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Serviço Firebase (para buscar dados da anamnese se necessário)
import FirebaseService from "../../../lib/firebaseService";
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";

const AnamneseViewer = ({ anamneseData, typeColor, onOpenPdf }) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
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

    // Função para renderizar lista de itens
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

    // Função para renderizar seção de texto
    const renderTextSection = (text) => {
        if (!text) return null;

        return (
            <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                {text}
            </Typography>
        );
    };

    // Função para renderizar sinais vitais de forma compacta
    const renderVitalSigns = () => {
        const vitalSigns = normalizedData.physicalExam?.vitalSigns;
        if (!vitalSigns || Object.values(vitalSigns).every(v => !v)) return null;

        return (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
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

    // Função para renderizar seção de hábitos de vida
    const renderSocialHistory = () => {
        const socialHistory = normalizedData.socialHistory;
        if (!socialHistory) return null;

        return (
            <Box sx={{ mt: 2 }}>
                {/* Tabagismo */}
                {socialHistory.isSmoker !== undefined && (
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <SmokingRoomsIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#F59E0B' }} />
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                Tabagismo:
                                <Typography component="span"
                                            sx={{
                                                ml: 1,
                                                color: socialHistory.isSmoker ? '#EF4444' : '#10B981',
                                                fontWeight: 600
                                            }}
                                >
                                    {socialHistory.isSmoker ? 'Sim' : 'Não'}
                                </Typography>
                            </Typography>
                        </Box>

                        {socialHistory.isSmoker && socialHistory.cigarettesPerDay > 0 && (
                            <Typography variant="body2" sx={{ ml: 4 }}>
                                {socialHistory.cigarettesPerDay} cigarros por dia
                            </Typography>
                        )}
                    </Box>
                )}

                {/* Consumo de álcool */}
                {socialHistory.isAlcoholConsumer !== undefined && (
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <LocalBarIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#7C3AED' }} />
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                Consumo de álcool:
                                <Typography component="span"
                                            sx={{
                                                ml: 1,
                                                color: socialHistory.isAlcoholConsumer ? '#F59E0B' : '#10B981',
                                                fontWeight: 600
                                            }}
                                >
                                    {socialHistory.isAlcoholConsumer ? 'Sim' : 'Não'}
                                </Typography>
                            </Typography>
                        </Box>

                        {socialHistory.isAlcoholConsumer && socialHistory.alcoholFrequency && (
                            <Typography variant="body2" sx={{ ml: 4 }}>
                                Frequência: {socialHistory.alcoholFrequency}
                            </Typography>
                        )}
                    </Box>
                )}

                {/* Uso de outras substâncias */}
                {socialHistory.isDrugUser !== undefined && (
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <NightlifeIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#EF4444' }} />
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                Uso de outras substâncias:
                                <Typography component="span"
                                            sx={{
                                                ml: 1,
                                                color: socialHistory.isDrugUser ? '#EF4444' : '#10B981',
                                                fontWeight: 600
                                            }}
                                >
                                    {socialHistory.isDrugUser ? 'Sim' : 'Não'}
                                </Typography>
                            </Typography>
                        </Box>

                        {socialHistory.isDrugUser && socialHistory.drugDetails && (
                            <Typography variant="body2" sx={{ ml: 4 }}>
                                Detalhes: {socialHistory.drugDetails}
                            </Typography>
                        )}
                    </Box>
                )}

                {/* Atividade Física */}
                {socialHistory.physicalActivity && (
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <SportsBasketballIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#10B981' }} />
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                Atividade Física
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ ml: 4 }}>
                            {socialHistory.physicalActivity}
                        </Typography>
                    </Box>
                )}

                {/* Hábitos Alimentares */}
                {socialHistory.dietHabits && (
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <RestaurantIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#F59E0B' }} />
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                Hábitos Alimentares
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ ml: 4 }}>
                            {socialHistory.dietHabits}
                        </Typography>
                    </Box>
                )}

                {/* Ocupação */}
                {socialHistory.occupation && (
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <WorkIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#3B82F6' }} />
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                Ocupação
                            </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ ml: 4 }}>
                            {socialHistory.occupation}
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    };

    // Função para renderizar seção de revisão de sistemas
    const renderSystemsReview = () => {
        const systemsReview = normalizedData.systemsReview;
        if (!systemsReview || !Object.values(systemsReview).some(value => value)) return null;

        const systems = [
            { name: 'Cardiovascular', value: systemsReview.cardiovascular, icon: <FavoriteIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#F50057' }} /> },
            { name: 'Respiratório', value: systemsReview.respiratory, icon: <AirIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#00BFA5' }} /> },
            { name: 'Gastrointestinal', value: systemsReview.gastrointestinal, icon: <RestaurantIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#F59E0B' }} /> },
            { name: 'Geniturinário', value: systemsReview.genitourinary, icon: <WcIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#3B82F6' }} /> },
            { name: 'Neurológico', value: systemsReview.neurological, icon: <PsychologyIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#8B5CF6' }} /> },
            { name: 'Musculoesquelético', value: systemsReview.musculoskeletal, icon: <AccessibilityNewIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#3B82F6' }} /> },
            { name: 'Endócrino', value: systemsReview.endocrine, icon: <CoronavirusIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#10B981' }} /> },
            { name: 'Hematológico', value: systemsReview.hematologic, icon: <LocalHospitalIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#EF4444' }} /> },
            { name: 'Psiquiátrico', value: systemsReview.psychiatric, icon: <PsychologyIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#8B5CF6' }} /> },
            { name: 'Dermatológico', value: systemsReview.dermatological, icon: <AccessibilityNewIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#F59E0B' }} /> }
        ];

        return (
            <Box sx={{ mt: 1 }}>
                {systems.filter(s => s.value).map((system, index) => (
                    <Accordion
                        key={index}
                        defaultExpanded
                        disableGutters
                        elevation={0}
                        sx={{
                            mb: 1,
                            border: '1px solid #EAECEF',
                            '&:before': { display: 'none' },
                            borderRadius: '4px',
                            overflow: 'hidden',
                        }}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            sx={{ bgcolor: alpha(typeColor.main, 0.03) }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {system.icon}
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {system.name}
                                </Typography>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography variant="body2">{system.value}</Typography>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        );
    };

    // Função para renderizar seção de exame físico
    const renderPhysicalExam = () => {
        const physicalExam = normalizedData.physicalExam;
        if (!physicalExam) return null;

        const examParts = [
            { name: 'Cabeça e Pescoço', value: physicalExam.headAndNeck, icon: <WcIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#F59E0B' }} /> },
            { name: 'Cardiovascular', value: physicalExam.cardiovascular, icon: <FavoriteIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#F50057' }} /> },
            { name: 'Respiratório', value: physicalExam.respiratory, icon: <AirIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#00BFA5' }} /> },
            { name: 'Abdômen', value: physicalExam.abdomen, icon: <RestaurantIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#F59E0B' }} /> },
            { name: 'Extremidades', value: physicalExam.extremities, icon: <AccessibilityNewIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#3B82F6' }} /> },
            { name: 'Neurológico', value: physicalExam.neurological, icon: <PsychologyIcon sx={{ fontSize: '1.2rem', mr: 1, color: '#8B5CF6' }} /> },
            { name: 'Outros', value: physicalExam.other, icon: <NoteAltIcon sx={{ fontSize: '1.2rem', mr: 1, color: typeColor.main }} /> }
        ];

        const hasExamParts = examParts.some(part => part.value);
        if (!hasExamParts && !Object.values(physicalExam.vitalSigns || {}).some(v => v)) return null;

        return (
            <>
                {/* Sinais vitais */}
                {renderVitalSigns()}

                {/* Aparência geral */}
                {physicalExam.generalAppearance && (
                    <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccessibilityNewIcon sx={{ fontSize: '1.2rem', mr: 1, color: typeColor.main }} />
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>Aparência Geral</Typography>
                        </Box>
                        <Typography variant="body2" sx={{ ml: 4 }}>
                            {physicalExam.generalAppearance}
                        </Typography>
                    </Box>
                )}

                {/* Detalhes de partes específicas */}
                {hasExamParts && (
                    <Box sx={{ mt: 1 }}>
                        {examParts.filter(part => part.value).map((part, index) => (
                            <Accordion
                                key={index}
                                disableGutters
                                elevation={0}
                                sx={{
                                    mb: 1,
                                    border: '1px solid #EAECEF',
                                    '&:before': { display: 'none' },
                                    borderRadius: '4px',
                                    overflow: 'hidden',
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{ bgcolor: alpha(typeColor.main, 0.03) }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {part.icon}
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {part.name}
                                        </Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography variant="body2">{part.value}</Typography>
                                </AccordionDetails>
                            </Accordion>
                        ))}
                    </Box>
                )}
            </>
        );
    };

    return (
        <Box sx={{ pt: 1, pb: 2 }}>
            {/* Queixa Principal - Em destaque */}
            {normalizedData.chiefComplaint && (
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        color: typeColor.main
                    }}>
                        <MedicalServicesIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                        Queixa Principal
                    </Typography>
                    <Typography variant="body1" sx={{
                        mt: 1,
                        p: 2,
                        borderLeft: `3px solid ${typeColor.main}`,
                        bgcolor: alpha(typeColor.main, 0.05),
                        borderRadius: '0 4px 4px 0',
                        fontWeight: 500
                    }}>
                        {normalizedData.chiefComplaint}
                    </Typography>
                </Box>
            )}

            {/* Acordo em acordeões para melhor organização */}
            <Accordion
                disableGutters
                defaultExpanded
                elevation={0}
                sx={{
                    mb: 1,
                    '&:before': { display: 'none' },
                    border: `1px solid ${alpha(typeColor.main, 0.2)}`,
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: alpha(typeColor.main, 0.05) }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MedicalInformationIcon sx={{ mr: 1, color: typeColor.main, fontSize: '1.2rem' }} />
                        <Typography sx={{ fontWeight: 600 }}>Motivo da Consulta e Diagnóstico</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    {/* História da doença atual */}
                    {normalizedData.illnessHistory && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: typeColor.main, display: 'flex', alignItems: 'center' }}>
                                <HealingIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                                História da Doença Atual
                            </Typography>
                            {renderTextSection(normalizedData.illnessHistory)}
                        </Box>
                    )}

                    {/* Diagnóstico */}
                    {normalizedData.diagnosis && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#EF4444', display: 'flex', alignItems: 'center' }}>
                                <LocalHospitalIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                                Diagnóstico
                            </Typography>
                            {renderTextSection(normalizedData.diagnosis)}
                        </Box>
                    )}

                    {/* Plano de tratamento */}
                    {normalizedData.treatmentPlan && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#22C55E', display: 'flex', alignItems: 'center' }}>
                                <NoteAltIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                                Plano de Tratamento
                            </Typography>
                            {renderTextSection(normalizedData.treatmentPlan)}
                        </Box>
                    )}

                    {/* Observações adicionais */}
                    {normalizedData.additionalNotes && (
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                Observações Adicionais
                            </Typography>
                            {renderTextSection(normalizedData.additionalNotes)}
                        </Box>
                    )}
                </AccordionDetails>
            </Accordion>

            {/* Exame Físico */}
            <Accordion
                disableGutters
                defaultExpanded
                elevation={0}
                sx={{
                    mb: 1,
                    '&:before': { display: 'none' },
                    border: `1px solid ${alpha(typeColor.main, 0.2)}`,
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: alpha(typeColor.main, 0.05) }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessibilityNewIcon sx={{ mr: 1, color: typeColor.main, fontSize: '1.2rem' }} />
                        <Typography sx={{ fontWeight: 600 }}>Exame Físico</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    {renderPhysicalExam()}
                </AccordionDetails>
            </Accordion>

            {/* Histórico */}
            <Accordion
                disableGutters
                defaultExpanded
                elevation={0}
                sx={{
                    mb: 1,
                    '&:before': { display: 'none' },
                    border: `1px solid ${alpha(typeColor.main, 0.2)}`,
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: alpha(typeColor.main, 0.05) }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <HistoryEduIcon sx={{ mr: 1, color: typeColor.main, fontSize: '1.2rem' }} />
                        <Typography sx={{ fontWeight: 600 }}>Histórico</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    {/* Histórico médico */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                            <MedicalInformationIcon sx={{ mr: 0.5, fontSize: '1rem', color: '#EF4444' }} />
                            Histórico Médico
                        </Typography>
                        {renderItemList(normalizedData.medicalHistory)}
                    </Box>

                    {/* Histórico cirúrgico */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                            <AirlineSeatFlatIcon sx={{ mr: 0.5, fontSize: '1rem', color: '#8B5CF6' }} />
                            Histórico Cirúrgico
                        </Typography>
                        {renderItemList(normalizedData.surgicalHistory)}
                    </Box>

                    {/* Medicamentos em uso */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                            <MedicationIcon sx={{ mr: 0.5, fontSize: '1rem', color: '#22C55E' }} />
                            Medicamentos em Uso
                        </Typography>
                        {renderItemList(normalizedData.currentMedications)}
                    </Box>

                    {/* Alergias */}
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                            <NightlifeIcon sx={{ mr: 0.5, fontSize: '1rem', color: '#F59E0B' }} />
                            Alergias
                        </Typography>
                        {renderItemList(normalizedData.allergies)}
                    </Box>

                    {/* Histórico familiar */}
                    {normalizedData.familyHistory && (
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                <FamilyRestroomIcon sx={{ mr: 0.5, fontSize: '1rem', color: '#3B82F6' }} />
                                Histórico Familiar
                            </Typography>
                            {renderTextSection(normalizedData.familyHistory)}
                        </Box>
                    )}
                </AccordionDetails>
            </Accordion>

            {/* Hábitos de Vida */}
            <Accordion
                disableGutters
                defaultExpanded
                elevation={0}
                sx={{
                    mb: 1,
                    '&:before': { display: 'none' },
                    border: `1px solid ${alpha(typeColor.main, 0.2)}`,
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: alpha(typeColor.main, 0.05) }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <RestaurantIcon sx={{ mr: 1, color: typeColor.main, fontSize: '1.2rem' }} />
                        <Typography sx={{ fontWeight: 600 }}>Hábitos de Vida</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    {renderSocialHistory()}
                </AccordionDetails>
            </Accordion>

            {/* Revisão de Sistemas */}
            <Accordion
                disableGutters
                defaultExpanded
                elevation={0}
                sx={{
                    mb: 1,
                    '&:before': { display: 'none' },
                    border: `1px solid ${alpha(typeColor.main, 0.2)}`,
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: alpha(typeColor.main, 0.05) }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MonitorHeartIcon sx={{ mr: 1, color: typeColor.main, fontSize: '1.2rem' }} />
                        <Typography sx={{ fontWeight: 600 }}>Revisão de Sistemas</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    {renderSystemsReview()}
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};

export default AnamneseViewer;