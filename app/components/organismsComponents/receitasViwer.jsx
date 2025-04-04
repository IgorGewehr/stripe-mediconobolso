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
    alpha,
    Paper,
    Grid
} from "@mui/material";

// Icons
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MedicationIcon from "@mui/icons-material/Medication";
import EventIcon from "@mui/icons-material/Event";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import NoteAltIcon from "@mui/icons-material/NoteAlt";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

// Date formatting
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Firebase service
import FirebaseService from "../../../lib/firebaseService";

const ReceitaViewer = ({ receitaData, typeColor, onOpenPdf }) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [normalizedData, setNormalizedData] = useState(null);

    // Efeito para normalizar os dados da receita, independente de sua estrutura
    useEffect(() => {
        const normalizeData = async () => {
            if (!receitaData) return;

            setLoading(true);

            try {
                // Se os dados estiverem em um formato diferente, vamos normalizar
                let normalized = { ...receitaData };

                // Verificar se temos prescriptionId e precisamos buscar mais dados
                if (receitaData.prescriptionId && !receitaData.tipo) {
                    try {
                        // Tentar buscar dados completos da receita
                        const fullData = await FirebaseService.getPrescription(
                            receitaData.doctorId,
                            receitaData.patientId,
                            receitaData.prescriptionId
                        );

                        if (fullData) {
                            // Mesclar os dados completos com os dados da nota
                            normalized = { ...normalized, ...fullData };
                        }
                    } catch (error) {
                        console.error("Erro ao buscar dados completos da receita:", error);
                    }
                }

                // Garantir que temos uma lista de medicamentos
                normalized.medicamentos = normalized.medicamentos || normalized.medications || [];

                // Converter de medications para medicamentos se necessário
                if (normalized.medications && normalized.medications.length > 0 && !normalized.medicamentos.length) {
                    normalized.medicamentos = normalized.medications.map(med => ({
                        nome: med.medicationName || med.name,
                        concentracao: med.dosage,
                        posologia: med.frequency,
                        duracao: med.duration,
                        quantidade: med.quantity,
                        observacao: med.observation
                    }));
                }

                setNormalizedData(normalized);
            } catch (error) {
                console.error("Erro ao normalizar dados da receita:", error);
            } finally {
                setLoading(false);
            }
        };

        normalizeData();
    }, [receitaData]);

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

    // Função para obter o rótulo do tipo de receita
    const getReceitaTypeLabel = () => {
        const tipo = normalizedData.tipo || "";

        switch(tipo.toLowerCase()) {
            case "controlada":
                return "Receita Controlada";
            case "especial":
                return "Receita Especial";
            case "antimicrobiano":
                return "Receita de Antimicrobiano";
            default:
                return "Receita Médica";
        }
    };

    // Função para obter o tipo de uso
    const getUsoLabel = () => {
        const uso = normalizedData.uso || "";
        return uso.charAt(0).toUpperCase() + uso.slice(1) || "Interno";
    };

    // Função para renderizar medicamentos
    const renderMedicamentos = () => {
        const medicamentos = normalizedData.medicamentos || [];

        if (medicamentos.length === 0) {
            return (
                <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                    Nenhum medicamento registrado
                </Typography>
            );
        }

        return (
            <Box sx={{ mt: 2 }}>
                {medicamentos.map((med, index) => (
                    <Paper
                        key={index}
                        elevation={0}
                        sx={{
                            mb: 2,
                            p: 2,
                            border: '1px solid #EAECEF',
                            borderRadius: '8px',
                            backgroundColor: alpha(typeColor.main, 0.05)
                        }}
                    >
                        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                            <LocalPharmacyIcon sx={{ mr: 1, fontSize: '1.2rem', color: typeColor.main }} />
                            {med.nome}
                            {med.concentracao && (
                                <Typography component="span" sx={{ ml: 1, fontWeight: 400 }}>
                                    {med.concentracao}
                                </Typography>
                            )}
                        </Typography>

                        {med.posologia && (
                            <Typography variant="body1" sx={{ mt: 1, pl: 3 }}>
                                <strong>Posologia:</strong> {med.posologia}
                            </Typography>
                        )}

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, pl: 3 }}>
                            {med.quantidade && (
                                <Chip
                                    label={`Quantidade: ${med.quantidade}`}
                                    size="small"
                                    sx={{
                                        bgcolor: alpha(typeColor.main, 0.1),
                                        color: theme.palette.text.primary,
                                    }}
                                />
                            )}

                            {med.duracao && (
                                <Chip
                                    label={`Duração: ${med.duracao}`}
                                    size="small"
                                    sx={{
                                        bgcolor: alpha(typeColor.main, 0.1),
                                        color: theme.palette.text.primary,
                                    }}
                                />
                            )}
                        </Box>

                        {med.observacao && (
                            <Typography variant="body2" sx={{ mt: 1, pl: 3, fontStyle: 'italic', color: theme.palette.text.secondary }}>
                                <strong>Observação:</strong> {med.observacao}
                            </Typography>
                        )}
                    </Paper>
                ))}
            </Box>
        );
    };

    // Função para renderizar botão de PDF se disponível
    const renderPdfButton = () => {
        if (!normalizedData.pdfUrl) return null;

        return (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Button
                    variant="outlined"
                    startIcon={<PictureAsPdfIcon />}
                    onClick={onOpenPdf}
                    sx={{
                        borderColor: typeColor.main,
                        color: typeColor.main,
                        '&:hover': {
                            backgroundColor: alpha(typeColor.main, 0.1),
                            borderColor: typeColor.main
                        }
                    }}
                >
                    Visualizar Receita Completa (PDF)
                </Button>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                    Clique para abrir a receita em formato PDF
                </Typography>
            </Box>
        );
    };

    return (
        <Box sx={{ pt: 1, pb: 2 }}>
            {/* Tipo de Receita - Em destaque */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    color: typeColor.main
                }}>
                    <MedicationIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                    {getReceitaTypeLabel()}
                </Typography>

                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                backgroundColor: alpha(typeColor.light, 0.5),
                                borderRadius: 2,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}
                        >
                            <Typography variant="body2" color="textSecondary">Tipo de Receita</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: typeColor.main, mt: 0.5 }}>
                                {normalizedData.tipo ? normalizedData.tipo.charAt(0).toUpperCase() + normalizedData.tipo.slice(1) : "Comum"}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                backgroundColor: alpha(typeColor.light, 0.5),
                                borderRadius: 2,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}
                        >
                            <Typography variant="body2" color="textSecondary">Uso</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: typeColor.main, mt: 0.5 }}>
                                {getUsoLabel()}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                backgroundColor: alpha(typeColor.light, 0.5),
                                borderRadius: 2,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}
                        >
                            <Typography variant="body2" color="textSecondary">Data de Emissão</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: typeColor.main, mt: 0.5 }}>
                                {formatDate(normalizedData.dataEmissao)}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 2,
                                backgroundColor: alpha(typeColor.light, 0.5),
                                borderRadius: 2,
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center'
                            }}
                        >
                            <Typography variant="body2" color="textSecondary">Validade</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: typeColor.main, mt: 0.5 }}>
                                {formatDate(normalizedData.dataValidade)}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            {/* Orientações Gerais (se houver) */}
            {normalizedData.orientacaoGeral && (
                <Accordion
                    disableGutters
                    defaultExpanded
                    elevation={0}
                    sx={{
                        mb: 2,
                        '&:before': { display: 'none' },
                        border: `1px solid ${alpha(typeColor.main, 0.2)}`,
                        borderRadius: '4px',
                        overflow: 'hidden'
                    }}
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: alpha(typeColor.main, 0.05) }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <InfoOutlinedIcon sx={{ mr: 1, color: typeColor.main, fontSize: '1.2rem' }} />
                            <Typography sx={{ fontWeight: 600 }}>Orientações Gerais</Typography>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                            {normalizedData.orientacaoGeral}
                        </Typography>
                    </AccordionDetails>
                </Accordion>
            )}

            {/* Medicamentos */}
            <Accordion
                disableGutters
                defaultExpanded
                elevation={0}
                sx={{
                    mb: 2,
                    '&:before': { display: 'none' },
                    border: `1px solid ${alpha(typeColor.main, 0.2)}`,
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}
            >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: alpha(typeColor.main, 0.05) }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MedicationIcon sx={{ mr: 1, color: typeColor.main, fontSize: '1.2rem' }} />
                        <Typography sx={{ fontWeight: 600 }}>Medicamentos</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    {renderMedicamentos()}
                </AccordionDetails>
            </Accordion>

            {/* Botão de PDF */}
            {renderPdfButton()}
        </Box>
    );
};

export default ReceitaViewer;