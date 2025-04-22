"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Button,
    Tooltip,
    useTheme,
    alpha
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';

// Categorias de exames
const examCategories = [
    {
        id: "LabGerais",
        title: "Exames Laboratoriais Gerais",
        icon: "🩸",
        color: "#EF4444",
        exams: ["Hemograma completo", "Plaquetas", "Glicose", "Ureia", "Creatinina", "Ácido Úrico", "Urina tipo 1 (EAS)", "Fezes"]
    },
    {
        id: "PerfilLipidico",
        title: "Perfil Lipídico",
        icon: "⭕️",
        color: "#F97316",
        exams: ["Colesterol Total", "HDL", "LDL", "Triglicerídeos"]
    },
    {
        id: "Hepaticos",
        title: "Exames Hepáticos e Pancreáticos",
        icon: "🫁",
        color: "#EC4899",
        exams: ["TGO (AST)", "TGP (ALT)", "Gama GT", "Bilirrubinas", "Amilase", "Lipase", "Albumina", "Proteínas totais e frações"]
    },
    {
        id: "Inflamatorios",
        title: "Inflamatórios e Imunológicos",
        icon: "🔬",
        color: "#EAB308",
        exams: ["PCR", "VHS", "Fator Reumatoide", "FAN", "Anti-DNA", "Anti-CCP", "ANCA", "D-Dímero", "Coagulograma"]
    },
    {
        id: "Hormonais",
        title: "Hormonais",
        icon: "⚗️",
        color: "#8B5CF6",
        exams: ["TSH", "T3", "T4", "Prolactina", "LH", "FSH", "Testosterona", "Estradiol", "Progesterona", "DHEA", "Cortisol", "Insulina", "Hemoglobina glicada"]
    },
    {
        id: "Vitaminas",
        title: "Vitaminas e Minerais",
        icon: "💊",
        color: "#F59E0B",
        exams: ["Vitamina D", "Vitamina B12", "Cálcio", "Fósforo", "Magnésio", "Sódio (Na)", "Potássio (K)"]
    },
    {
        id: "Infecciosos",
        title: "Infecciosos / Sorologias",
        icon: "🦠",
        color: "#06B6D4",
        exams: ["Hepatite A", "Hepatite B", "Hepatite C", "HIV", "Sífilis (VDRL)", "Dengue", "Zika", "Chikungunya"]
    },
    {
        id: "Tumorais",
        title: "Marcadores Tumorais",
        icon: "🔍",
        color: "#F43F5E",
        exams: ["PSA", "CA 125", "CA 15-3", "CA 19-9", "CEA", "AFP", "Beta-HCG"]
    },
    {
        id: "Cardiacos",
        title: "Cardíacos e Musculares",
        icon: "❤️",
        color: "#10B981",
        exams: ["CK", "CK-MB", "Troponina"]
    },
    {
        id: "Imagem",
        title: "Imagem e Diagnóstico",
        icon: "📷",
        color: "#6366F1",
        exams: ["Raio-X", "Ultrassonografia", "Tomografia Computadorizada", "Ressonância Magnética", "Densitometria Óssea"]
    },
    {
        id: "Outros",
        title: "Outros Exames",
        icon: "🧪",
        color: "#3B82F6",
        exams: ["Ferritina", "Ferro sérico", "Cistatina C", "Gasometria arterial", "Urina 24h", "Colinesterase", "Tipagem sanguínea", "Beta-HCG"]
    }
];

// Componente de Tabela de Exames
const ExamTable = ({ results = {}, onUpdateResults, readOnly = false }) => {
    const theme = useTheme();
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [savingSuccess, setSavingSuccess] = useState(false);
    const [copiedCategory, setCopiedCategory] = useState(null);

    // Inicializar a primeira categoria expandida
    useEffect(() => {
        if (examCategories.length > 0 && expandedCategory === null) {
            setExpandedCategory(examCategories[0].id);
        }
    }, []);

    // Função para atualizar o resultado de um exame
    const handleUpdateExamResult = (categoryId, examName, value) => {
        if (readOnly) return;

        if (!onUpdateResults) {
            console.warn("onUpdateResults não foi fornecido como prop");
            return;
        }

        const updatedResults = {
            ...results,
            [categoryId]: {
                ...(results[categoryId] || {}),
                [examName]: value
            }
        };

        // Chamar a função de callback para atualizar os resultados
        onUpdateResults(updatedResults);
    };

    // Lidar com a expansão de uma categoria
    const handleCategoryExpand = (categoryId) => {
        setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
    };

    // Função para copiar os resultados de uma categoria para a área de transferência
    const handleCopyCategory = (categoryId, event) => {
        // Não acionando o accordion ao clicar no botão de copiar
        if (event) {
            event.stopPropagation();
        }

        const category = examCategories.find(cat => cat.id === categoryId);
        if (!category) return;

        let copyText = `${category.title}:\n\n`;

        category.exams.forEach(examName => {
            const value = results[categoryId]?.[examName] || "";
            copyText += `${examName}: ${value}\n`;
        });

        navigator.clipboard.writeText(copyText).then(() => {
            setCopiedCategory(categoryId);
            setTimeout(() => setCopiedCategory(null), 2000);
        });
    };

    // Função para salvar os resultados (simulação)
    const handleSaveResults = () => {
        // Aqui você implementaria a lógica real de salvamento
        setSavingSuccess(true);
        setTimeout(() => setSavingSuccess(false), 2000);
    };

    // Função para exportar como PDF (simulação)
    const handleExportPDF = () => {
        alert("Funcionalidade de exportação para PDF será implementada em breve!");
    };

    // Renderizar componente de Copy Button que não é um Button real
    const renderCopyButton = (categoryId) => {
        return (
            <Box
                component="div"
                role="button"
                tabIndex={0}
                aria-label="Copiar resultados"
                onClick={(e) => handleCopyCategory(categoryId, e)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCopyCategory(categoryId, e);
                    }
                }}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    color: copiedCategory === categoryId ? theme.palette.success.main : theme.palette.text.secondary,
                    cursor: 'pointer',
                    '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                    },
                    zIndex: 2
                }}
            >
                <Tooltip title={copiedCategory === categoryId ? "Copiado!" : "Copiar resultados"}>
                    <Box component="div" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {copiedCategory === categoryId
                            ? <CheckCircleOutlineIcon fontSize="small" />
                            : <ContentCopyOutlinedIcon fontSize="small" />
                        }
                    </Box>
                </Tooltip>
            </Box>
        );
    };

    return (
        <Box sx={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3
            }}>
                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 600,
                        color: theme.palette.text.primary
                    }}
                >
                    Tabela de Resultados de Exames
                </Typography>

                {!readOnly && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadOutlinedIcon />}
                            onClick={handleExportPDF}
                            sx={{ borderRadius: '8px' }}
                        >
                            Exportar PDF
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={savingSuccess ? <CheckCircleOutlineIcon /> : <SaveOutlinedIcon />}
                            onClick={handleSaveResults}
                            sx={{ borderRadius: '8px' }}
                        >
                            {savingSuccess ? "Salvo!" : "Salvar"}
                        </Button>
                    </Box>
                )}
            </Box>

            {/* Categorias de exames em acordeão */}
            <Box sx={{ mb: 4 }}>
                {examCategories.map((category) => (
                    <Accordion
                        key={category.id}
                        expanded={expandedCategory === category.id}
                        onChange={() => handleCategoryExpand(category.id)}
                        sx={{
                            mb: 2,
                            boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
                            borderRadius: '12px !important',
                            overflow: 'hidden',
                            '&:before': {
                                display: 'none',
                            },
                            border: `1px solid ${alpha(category.color, 0.2)}`
                        }}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            sx={{
                                backgroundColor: alpha(category.color, 0.1),
                                borderLeft: `4px solid ${category.color}`,
                                '&.Mui-expanded': {
                                    borderBottom: `1px solid ${alpha(category.color, 0.2)}`
                                },
                                '& .MuiAccordionSummary-content': {
                                    width: '100%',
                                    // Importante: margin ajustada para manter espaço para o botão de expandir
                                    margin: '12px 0',
                                }
                            }}
                        >
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                width: '100%',
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box
                                        component="span"
                                        sx={{
                                            mr: 2,
                                            fontSize: '20px',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {category.icon}
                                    </Box>
                                    <Typography
                                        variant="subtitle1"
                                        sx={{
                                            fontWeight: 600,
                                            color: alpha(category.color, 0.9)
                                        }}
                                    >
                                        {category.title}
                                    </Typography>
                                </Box>

                                {/* Este é o componente que renderiza o botão de copiar sem usar um <button> */}
                                {renderCopyButton(category.id)}
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    width: '100%',
                                    borderRadius: 0
                                }}
                            >
                                {category.exams.map((examName, index) => (
                                    <Box
                                        key={examName}
                                        sx={{
                                            p: 2,
                                            display: 'flex',
                                            borderBottom: index < category.exams.length - 1 ? `1px solid ${alpha(category.color, 0.1)}` : 'none',
                                            '&:hover': {
                                                backgroundColor: alpha(category.color, 0.03)
                                            }
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                flex: 1,
                                                fontWeight: 500,
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            {examName}
                                        </Box>
                                        <Box sx={{ width: '40%' }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Preencher"
                                                value={results[category.id]?.[examName] || ''}
                                                onChange={(e) => handleUpdateExamResult(category.id, examName, e.target.value)}
                                                disabled={readOnly}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '8px',
                                                        '&:hover fieldset': {
                                                            borderColor: alpha(category.color, 0.5),
                                                        },
                                                        '&.Mui-focused fieldset': {
                                                            borderColor: category.color,
                                                        },
                                                    }
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                ))}
                            </Paper>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>
        </Box>
    );
};

export default ExamTable;