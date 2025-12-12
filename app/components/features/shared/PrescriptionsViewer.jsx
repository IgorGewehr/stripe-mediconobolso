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
    Divider
} from "@mui/material";

// Icons
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

// Date formatting
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Firebase service
import FirebaseService from "../../../../lib/firebaseService";

const ReceitaViewer = ({ receitaData, typeColor, onOpenPdf }) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [normalizedData, setNormalizedData] = useState(null);

    // Efeito para normalizar os dados da receita
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

    return (
        <Box sx={{ pt: 1, pb: 2, maxWidth: '900px', mx: 'auto' }}>
            {/* 1. ORIENTAÇÕES GERAIS - Primeiro e centralizado */}
            {normalizedData.orientacaoGeral && (
                <Paper
                    elevation={1}
                    sx={{
                        p: 3,
                        mb: 4,
                        borderRadius: '10px',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        backgroundColor: alpha(theme.palette.background.paper, 0.9),
                        textAlign: 'center',
                        maxWidth: '800px',
                        mx: 'auto'
                    }}
                >
                    <Typography
                        variant="body1"
                        sx={{
                            whiteSpace: 'pre-line',
                            lineHeight: 1.7,
                            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                            fontWeight: 400,
                            fontSize: '1.05rem',
                            color: theme.palette.text.primary,
                            letterSpacing: '0.01em'
                        }}
                    >
                        {normalizedData.orientacaoGeral}
                    </Typography>
                </Paper>
            )}

            {/* 2. MEDICAMENTOS - Visualização prática */}
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
                    Medicamentos
                </Typography>

                {normalizedData.medicamentos.length === 0 ? (
                    <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                        Nenhum medicamento registrado
                    </Typography>
                ) : (
                    <Grid container spacing={2}>
                        {normalizedData.medicamentos.map((med, index) => (
                            <Grid item xs={12} md={6} key={index}>
                                <Paper
                                    elevation={1}
                                    sx={{
                                        p: 2,
                                        height: '100%',
                                        borderRadius: '8px',
                                        borderLeft: `4px solid ${typeColor.main}`,
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <LocalPharmacyIcon sx={{ color: typeColor.main, mr: 1 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                            {med.nome}
                                            {med.concentracao && (
                                                <Typography component="span" sx={{ ml: 1, fontWeight: 400, fontSize: '0.9rem' }}>
                                                    {med.concentracao}
                                                </Typography>
                                            )}
                                        </Typography>
                                    </Box>

                                    {med.posologia && (
                                        <Typography variant="body1" sx={{ mb: 1.5, fontWeight: 400 }}>
                                            {med.posologia}
                                        </Typography>
                                    )}

                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                                        {med.quantidade && (
                                            <Chip
                                                label={`${med.quantidade}`}
                                                size="small"
                                                sx={{
                                                    bgcolor: alpha(typeColor.main, 0.1),
                                                    color: theme.palette.text.primary,
                                                }}
                                            />
                                        )}

                                        {med.duracao && (
                                            <Chip
                                                label={`${med.duracao}`}
                                                size="small"
                                                sx={{
                                                    bgcolor: alpha(typeColor.main, 0.1),
                                                    color: theme.palette.text.primary,
                                                }}
                                            />
                                        )}
                                    </Box>

                                    {med.observacao && (
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                mt: 'auto',
                                                pt: 1,
                                                fontStyle: 'italic',
                                                color: theme.palette.text.secondary,
                                                borderTop: `1px dashed ${theme.palette.divider}`
                                            }}
                                        >
                                            {med.observacao}
                                        </Typography>
                                    )}
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>

            {/* 3. INFORMAÇÕES ADICIONAIS - No final */}
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    borderRadius: '8px',
                    backgroundColor: alpha(typeColor.light, 0.2),
                    mb: 3
                }}
            >
                <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                        <Typography
                            variant="subtitle2"
                            sx={{ display: 'block', color: "#22C55E", fontWeight: 600, fontSize: '0.9rem' }}
                        >
                            TIPO
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {normalizedData.tipo
                                ? normalizedData.tipo.charAt(0).toUpperCase() + normalizedData.tipo.slice(1)
                                : "Comum"}
                        </Typography>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                        <Typography
                            variant="subtitle2"
                            sx={{ display: 'block', color: "#22C55E", fontWeight: 600, fontSize: '0.9rem' }}
                        >
                            USO
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {normalizedData.uso
                                ? normalizedData.uso.charAt(0).toUpperCase() + normalizedData.uso.slice(1)
                                : "Interno"}
                        </Typography>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                        <Typography
                            variant="subtitle2"
                            sx={{ display: 'block', color: "#22C55E", fontWeight: 600, fontSize: '0.9rem' }}
                        >
                            EMISSÃO
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {formatDate(normalizedData.dataEmissao)}
                        </Typography>
                    </Grid>

                    <Grid item xs={6} sm={3}>
                        <Typography
                            variant="subtitle2"
                            sx={{ display: 'block', color: "#22C55E", fontWeight: 600, fontSize: '0.9rem' }}
                        >
                            VALIDADE
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {formatDate(normalizedData.dataValidade)}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>

        </Box>
    );
};

export default ReceitaViewer;