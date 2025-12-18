"use client";

import React, { useState, useEffect, useRef } from 'react';
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
    alpha,
    Badge,
    CircularProgress,
    Chip,
    Fade,
    LinearProgress,
    InputAdornment
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import WarningIcon from '@mui/icons-material/Warning';
import FileDownloadDoneIcon from '@mui/icons-material/FileDownloadDone';
import ClearIcon from '@mui/icons-material/Clear';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

// Componente de Tabela de Exames Melhorado
const ExamTable = ({ results = {}, onUpdateResults, readOnly = false, isAiProcessed = false }) => {
    const theme = useTheme();
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [savingSuccess, setSavingSuccess] = useState(false);
    const [copiedCategory, setCopiedCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [focusedField, setFocusedField] = useState({ category: '', exam: '' });
    const [isExporting, setIsExporting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [filledFieldsCount, setFilledFieldsCount] = useState(0);
    const [totalFieldsCount, setTotalFieldsCount] = useState(0);
    const [aiHighlightTimeout, setAiHighlightTimeout] = useState(null);
    const [showTips, setShowTips] = useState(false);

    // Array de refs para campos de texto
    const textFieldRefs = useRef({});

    // Calcular estatísticas de preenchimento
    useEffect(() => {
        let filled = 0;
        let total = 0;

        examCategories.forEach(category => {
            category.exams.forEach(examName => {
                total++;
                if (results[category.id]?.[examName]) {
                    filled++;
                }
            });
        });

        setFilledFieldsCount(filled);
        setTotalFieldsCount(total);
    }, [results]);

    // Inicializar a primeira categoria expandida e destacar campos preenchidos com IA
    useEffect(() => {
        // Expandir primeira categoria com resultados ou a primeira categoria geral
        const categoryWithResults = examCategories.find(
            category => results[category.id] && Object.keys(results[category.id]).length > 0
        );

        if (categoryWithResults) {
            setExpandedCategory(categoryWithResults.id);
        } else if (examCategories.length > 0 && expandedCategory === null) {
            setExpandedCategory(examCategories[0].id);
        }

        // Se os dados foram processados pela IA, adicionar efeito de destaque
        if (isAiProcessed && Object.keys(results).length > 0) {
            const timeout = setTimeout(() => {
                // O timeout permite que o efeito de destaque desapareça após 5 segundos
                clearTimeout(aiHighlightTimeout);
                setAiHighlightTimeout(null);
            }, 5000);

            setAiHighlightTimeout(timeout);

            return () => {
                clearTimeout(timeout);
            };
        }
    }, []);

    // Função para exportar resultados de exames para PDF e abrir em nova aba
    const handleExportPDF = () => {
        setIsExporting(true);

        // Primeiro, importe as bibliotecas necessárias
        // Nota: Certifique-se de adicionar estas dependências no seu package.json
        // npm install --save jspdf jspdf-autotable
        import('jspdf').then(({ default: jsPDF }) => {
            // Importe o plugin autoTable normalmente (não como dynamic import)
            // e ele se registrará globalmente
            require('jspdf-autotable');

            try {
                // Informações do paciente (substitua com dados reais do seu app)
                const patientName = "Nome do Paciente"; // Obter da prop ou contexto
                const patientBirthDate = "01/01/1980"; // Obter da prop ou contexto
                const patientId = "123456"; // Obter da prop ou contexto
                const doctorName = "Dr. Nome do Médico"; // Obter da prop ou contexto
                const clinicName = "Clínica Médica"; // Obter da prop ou contexto
                const examDate = new Date().toLocaleDateString('pt-BR');

                // Criar documento PDF
                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                // Definir cores consistentes com a UI
                const primaryColor = "#1852FE";
                const textColor = "#344054";
                const headerBgColor = "#ECF1FF";

                // Configurações de página
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const margin = 20;
                const contentWidth = pageWidth - (margin * 2);

                // Funções auxiliares
                const addPageNumberFooter = (doc) => {
                    const pageCount = doc.internal.getNumberOfPages();
                    for (let i = 1; i <= pageCount; i++) {
                        doc.setPage(i);
                        doc.setFontSize(9);
                        doc.setTextColor(100, 100, 100);
                        doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
                        doc.text(`Exportado em: ${new Date().toLocaleString('pt-BR')}`, margin, pageHeight - 10);
                        doc.text(`${clinicName}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
                    }
                };

                // ----- CABEÇALHO -----
                // Adicionar título do relatório
                doc.setFillColor(headerBgColor);
                doc.rect(0, 0, pageWidth, 40, 'F');

                doc.setDrawColor(primaryColor);
                doc.setLineWidth(0.5);
                doc.line(margin, 40, pageWidth - margin, 40);

                doc.setFontSize(18);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(primaryColor);
                doc.text("RESULTADOS DE EXAMES", margin, 15);



                // ----- CONTEÚDO DO EXAME -----
                let yPosition = 50; // Posição vertical inicial após o cabeçalho

                // Título da seção de resultados
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(primaryColor);
                doc.text("RESULTADOS", margin, yPosition);

                yPosition += 8;

                // Verificar se há resultados
                const hasAnyResults = Object.values(results).some(
                    categoryResults => Object.keys(categoryResults || {}).length > 0
                );

                if (!hasAnyResults) {
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'italic');
                    doc.setTextColor(textColor);
                    doc.text("Nenhum resultado registrado para este exame.", margin, yPosition);
                    yPosition += 10;
                }

                // Usando tabelas manuais se autoTable não funcionar
                const createTableManually = (doc, startY, title, headers, rows, color) => {
                    // Define as larguras das colunas (em mm)
                    const colWidth = [80, contentWidth - 80];
                    const rowHeight = 10;

                    // Cabeçalho da tabela
                    doc.setFillColor(color);
                    doc.rect(margin, startY, contentWidth, rowHeight, 'F');

                    doc.setTextColor(255, 255, 255);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10);
                    doc.text(headers[0], margin + 3, startY + 7);
                    doc.text(headers[1], margin + colWidth[0] + 3, startY + 7);

                    let currentY = startY + rowHeight;

                    // Linhas da tabela
                    rows.forEach((row, index) => {
                        // Alternar cor de fundo
                        if (index % 2 === 0) {
                            doc.setFillColor(245, 245, 245);
                        } else {
                            doc.setFillColor(255, 255, 255);
                        }
                        doc.rect(margin, currentY, contentWidth, rowHeight, 'F');

                        // Texto da linha
                        doc.setTextColor(textColor);
                        doc.setFont('helvetica', 'normal');
                        doc.text(row[0], margin + 3, currentY + 7);
                        doc.text(row[1], margin + colWidth[0] + 3, currentY + 7);

                        currentY += rowHeight;
                    });

                    // Borda da tabela
                    doc.setDrawColor(200, 200, 200);
                    doc.rect(margin, startY, contentWidth, currentY - startY, 'S');

                    // Retorna a posição Y final
                    return currentY + 5;
                };

                // Para cada categoria de exame com resultados
                examCategories.forEach(category => {
                    // Pular se não tiver resultados nesta categoria
                    if (!results[category.id] || Object.keys(results[category.id]).length === 0) return;

                    // Verificar se precisa adicionar nova página
                    if (yPosition > pageHeight - 60) {
                        doc.addPage();
                        yPosition = 20;
                    }

                    // Adicionar título da categoria
                    doc.setFontSize(13);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(category.color);
                    doc.text(`${category.title}`, margin, yPosition);

                    yPosition += 6;

                    // Preparar dados para a tabela
                    const tableRows = [];
                    Object.entries(results[category.id]).forEach(([examName, value]) => {
                        if (value) {
                            tableRows.push([examName, value]);
                        }
                    });

                    if (tableRows.length > 0) {
                        // Tentar usar autoTable se disponível
                        if (typeof doc.autoTable === 'function') {
                            try {
                                // Renderizar tabela de resultados com autoTable
                                doc.autoTable({
                                    startY: yPosition,
                                    head: [['Exame', 'Resultado']],
                                    body: tableRows,
                                    headStyles: {
                                        fillColor: category.color,
                                        textColor: '#FFFFFF',
                                        fontStyle: 'bold'
                                    },
                                    styles: {
                                        textColor: textColor,
                                        fontSize: 10,
                                        cellPadding: 4
                                    },
                                    alternateRowStyles: {
                                        fillColor: [245, 245, 245]
                                    },
                                    columnStyles: {
                                        0: { cellWidth: 80 },
                                        1: { cellWidth: 'auto' }
                                    },
                                    margin: { left: margin, right: margin }
                                });

                                // Atualizar posição Y após a tabela
                                yPosition = doc.lastAutoTable.finalY + 10;
                            } catch (autoTableError) {
                                console.error("Erro ao usar autoTable, usando método manual:", autoTableError);
                                // Fallback para tabela manual se autoTable falhar
                                yPosition = createTableManually(
                                    doc,
                                    yPosition,
                                    category.title,
                                    ['Exame', 'Resultado'],
                                    tableRows,
                                    category.color
                                );
                            }
                        } else {
                            console.warn("autoTable não disponível, usando método manual");
                            // Caso autoTable não esteja disponível, usar a abordagem manual
                            yPosition = createTableManually(
                                doc,
                                yPosition,
                                category.title,
                                ['Exame', 'Resultado'],
                                tableRows,
                                category.color
                            );
                        }
                    } else {
                        doc.setFontSize(10);
                        doc.setFont('helvetica', 'italic');
                        doc.text("Nenhum resultado registrado nesta categoria.", margin + 5, yPosition);
                        yPosition += 10;
                    }
                });

                // ----- ASSINATURA -----
                if (yPosition > pageHeight - 40) {
                    doc.addPage();
                    yPosition = 20;
                }

                // Linha para assinatura
                const signatureWidth = 70;
                const signatureX = pageWidth - margin - signatureWidth;

                doc.setDrawColor(100, 100, 100);
                doc.line(signatureX, yPosition + 20, signatureX + signatureWidth, yPosition + 20);

                // Texto da assinatura
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 100, 100);
                doc.text(`${doctorName}`, signatureX + (signatureWidth / 2), yPosition + 25, { align: 'center' });

                // Adicionar numeração nas páginas
                addPageNumberFooter(doc);

                // Criar blob e abrir em nova aba
                const pdfBlob = doc.output('blob');
                const blobUrl = URL.createObjectURL(pdfBlob);

                // Abrir em nova aba
                const newTab = window.open(blobUrl, '_blank');
                if (!newTab) {
                    alert("O navegador bloqueou a abertura da nova aba. Verifique as configurações de pop-up.");
                }

                // Limpeza de URL (após algum tempo para garantir que o PDF carregou)
                setTimeout(() => {
                    URL.revokeObjectURL(blobUrl);
                }, 30000);

                setIsExporting(false);
            } catch (error) {
                console.error("Erro ao gerar PDF:", error);
                setIsExporting(false);
                alert("Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.");
            }
        }).catch(error => {
            console.error("Erro ao carregar bibliotecas para PDF:", error);
            setIsExporting(false);
            alert("Erro ao carregar as bibliotecas necessárias. Verifique se jsPDF está instalado.");
        });
    };

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
        setIsSaving(true);

        // Aqui você implementaria a lógica real de salvamento
        setTimeout(() => {
            setSavingSuccess(true);
            setIsSaving(false);
            setTimeout(() => setSavingSuccess(false), 2000);
        }, 800);
    };



    // Função para lidar com a tecla Enter em um campo
    const handleKeyDown = (e, categoryId, examIndex, examName) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            // Encontrar a categoria atual
            const categoryIndex = examCategories.findIndex(cat => cat.id === categoryId);
            if (categoryIndex === -1) return;

            const currentCategory = examCategories[categoryIndex];

            // Se não estamos no último exame da categoria atual
            if (examIndex < currentCategory.exams.length - 1) {
                // Mover para o próximo exame na mesma categoria
                const nextExamName = currentCategory.exams[examIndex + 1];
                if (textFieldRefs.current[`${categoryId}-${nextExamName}`]) {
                    textFieldRefs.current[`${categoryId}-${nextExamName}`].focus();
                }
            } else {
                // Se estamos no último exame da categoria atual

                // Verificar se há uma próxima categoria
                if (categoryIndex < examCategories.length - 1) {
                    const nextCategory = examCategories[categoryIndex + 1];

                    // Expandir a próxima categoria se não estiver expandida
                    if (expandedCategory !== nextCategory.id) {
                        setExpandedCategory(nextCategory.id);

                        // Precisamos esperar a expansão do accordion antes de focar
                        setTimeout(() => {
                            if (nextCategory.exams.length > 0 &&
                                textFieldRefs.current[`${nextCategory.id}-${nextCategory.exams[0]}`]) {
                                textFieldRefs.current[`${nextCategory.id}-${nextCategory.exams[0]}`].focus();
                            }
                        }, 300);
                    } else if (nextCategory.exams.length > 0) {
                        // Se já estiver expandida, focar no primeiro exame
                        if (textFieldRefs.current[`${nextCategory.id}-${nextCategory.exams[0]}`]) {
                            textFieldRefs.current[`${nextCategory.id}-${nextCategory.exams[0]}`].focus();
                        }
                    }
                }
            }
        }
    };

    // Filtrar categorias com base na pesquisa
    const filteredCategories = searchTerm.trim() === ''
        ? examCategories
        : examCategories.map(category => {
            // Filtrar exames na categoria que correspondem ao termo de pesquisa
            const filteredExams = category.exams.filter(exam =>
                exam.toLowerCase().includes(searchTerm.toLowerCase())
            );

            // Retornar categoria com exames filtrados
            return {
                ...category,
                exams: filteredExams
            };
        }).filter(category => category.exams.length > 0);

    // Verificar se uma categoria tem campos preenchidos
    const hasCategoryResults = (categoryId) => {
        return results[categoryId] && Object.keys(results[categoryId]).length > 0;
    };

    // Contar quantos campos estão preenchidos em uma categoria
    const getFilledFieldsInCategory = (categoryId) => {
        if (!results[categoryId]) return 0;
        return Object.keys(results[categoryId]).length;
    };

    // Calcular a porcentagem de preenchimento de uma categoria
    const getCategoryCompletionPercentage = (categoryId, categoryExams) => {
        if (!results[categoryId] || categoryExams.length === 0) return 0;
        const filledFields = getFilledFieldsInCategory(categoryId);
        return Math.round((filledFields / categoryExams.length) * 100);
    };

    // Calcular a porcentagem geral de preenchimento
    const getTotalCompletionPercentage = () => {
        if (totalFieldsCount === 0) return 0;
        return Math.round((filledFieldsCount / totalFieldsCount) * 100);
    };

    // Função para verificar se um valor foi possivelmente preenchido pela IA
    const isAiFilledValue = (categoryId, examName) => {
        return isAiProcessed && results[categoryId]?.[examName] && aiHighlightTimeout;
    };

    // Renderizar componente de Copy Button
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
                        color: theme.palette.text.primary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    <Box component="span" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                        📋
                    </Box>
                    Resultados de Exames
                    {isAiProcessed && (
                        <Tooltip title="Processado com IA">
                            <Chip
                                icon={<AutoAwesomeIcon fontSize="small" />}
                                label="IA"
                                size="small"
                                color="primary"
                                sx={{ ml: 1, height: 24 }}
                            />
                        </Tooltip>
                    )}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Dicas de preenchimento">
                        <IconButton
                            color={showTips ? "primary" : "default"}
                            onClick={() => setShowTips(!showTips)}
                            sx={{ borderRadius: '8px' }}
                        >
                            <TipsAndUpdatesIcon />
                        </IconButton>
                    </Tooltip>
                    {!readOnly && (
                        <>
                            <Button
                                variant="outlined"
                                startIcon={isExporting ? <CircularProgress size={20} /> : <DownloadOutlinedIcon />}
                                onClick={handleExportPDF}
                                disabled={isExporting || filledFieldsCount === 0}
                                sx={{
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: 600
                                }}
                            >
                                {isExporting ? "Exportando..." : "Exportar PDF"}
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={isSaving
                                    ? <CircularProgress size={20} color="inherit" />
                                    : (savingSuccess ? <CheckCircleOutlineIcon /> : <SaveOutlinedIcon />)
                                }
                                onClick={handleSaveResults}
                                disabled={isSaving}
                                sx={{
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    boxShadow: 'none',
                                    '&:hover': {
                                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                                    }
                                }}
                            >
                                {isSaving ? "Salvando..." : (savingSuccess ? "Salvo!" : "Salvar")}
                            </Button>
                        </>
                    )}
                </Box>
            </Box>

            {/* Dicas de preenchimento */}
            {showTips && (
                <Fade in={showTips}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            mb: 3,
                            borderRadius: '12px',
                            border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                            backgroundColor: alpha(theme.palette.info.light, 0.1)
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.info.dark, mb: 1 }}>
                                Dicas para preenchimento
                            </Typography>
                            <IconButton size="small" onClick={() => setShowTips(false)}>
                                <ClearIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            • Pressione <b>Enter</b> após preencher um campo para avançar para o próximo automaticamente
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            • Use a caixa de pesquisa para encontrar exames específicos rapidamente
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                            • Categorias com resultados já preenchidos têm um indicador de progresso colorido
                        </Typography>
                        <Typography variant="body2">
                            • Para copiar os resultados de uma categoria, clique no ícone <ContentCopyOutlinedIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} /> à direita do título
                        </Typography>
                    </Paper>
                </Fade>
            )}

            {/* Barra de Progresso Geral */}
            <Box sx={{
                mb: 3,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#F9FAFB',
                p: 2,
                borderRadius: '10px',
                border: '1px solid #EAECEF'
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                        Progresso de preenchimento
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {filledFieldsCount}/{totalFieldsCount} campos ({getTotalCompletionPercentage()}%)
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={getTotalCompletionPercentage()}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                        }
                    }}
                />
            </Box>

            {/* Campo de busca para facilitar encontrar exames específicos */}
            <TextField
                fullWidth
                placeholder="Buscar exame específico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                        borderRadius: '10px',
                        backgroundColor: '#F9FAFB',
                        '&.Mui-focused': {
                            boxShadow: '0 0 0 3px rgba(24, 82, 254, 0.1)'
                        }
                    }
                }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon color="action" />
                        </InputAdornment>
                    ),
                    endAdornment: searchTerm ? (
                        <InputAdornment position="end">
                            <IconButton
                                size="small"
                                onClick={() => setSearchTerm('')}
                                edge="end"
                            >
                                <ClearIcon fontSize="small" />
                            </IconButton>
                        </InputAdornment>
                    ) : null
                }}
            />

            {/* Categorias de exames em acordeão */}
            <Box sx={{ mb: 4 }}>
                {filteredCategories.map((category) => {
                    // Obter estatísticas da categoria
                    const categoryResults = results[category.id] || {};
                    const hasResults = Object.keys(categoryResults).length > 0;
                    const completionPercentage = getCategoryCompletionPercentage(category.id, category.exams);

                    return (
                        <Accordion
                            key={category.id}
                            expanded={expandedCategory === category.id}
                            onChange={() => handleCategoryExpand(category.id)}
                            sx={{
                                mb: 2,
                                boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
                                borderRadius: '12px !important',
                                overflow: 'hidden',
                                '&:before': {
                                    display: 'none',
                                },
                                border: hasResults
                                    ? `1px solid ${alpha(category.color, 0.5)}`
                                    : `1px solid ${alpha(category.color, 0.2)}`
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{
                                    backgroundColor: hasResults
                                        ? alpha(category.color, 0.15)
                                        : alpha(category.color, 0.05),
                                    borderLeft: `4px solid ${category.color}`,
                                    '&.Mui-expanded': {
                                        borderBottom: `1px solid ${alpha(category.color, 0.2)}`
                                    },
                                    '& .MuiAccordionSummary-content': {
                                        width: '100%',
                                        margin: '12px 0',
                                    },
                                    transition: 'all 0.2s ease'
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
                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <Typography
                                                variant="subtitle1"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: alpha(category.color, 0.9)
                                                }}
                                            >
                                                {category.title}
                                            </Typography>

                                            {/* Barra de progresso para categoria */}
                                            {hasResults && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                    <Box sx={{
                                                        width: 120,
                                                        height: 4,
                                                        backgroundColor: alpha(category.color, 0.2),
                                                        borderRadius: 2,
                                                        mr: 1
                                                    }}>
                                                        <Box sx={{
                                                            height: '100%',
                                                            width: `${completionPercentage}%`,
                                                            backgroundColor: category.color,
                                                            borderRadius: 2
                                                        }} />
                                                    </Box>
                                                    <Typography variant="caption" sx={{ color: alpha(category.color, 0.9) }}>
                                                        {completionPercentage}% preenchido
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {/* Badge para mostrar número de resultados preenchidos */}
                                        {hasResults && (
                                            <Tooltip title={`${getFilledFieldsInCategory(category.id)} resultados preenchidos`}>
                                                <Badge
                                                    badgeContent={getFilledFieldsInCategory(category.id)}
                                                    color="primary"
                                                    sx={{ mr: 2 }}
                                                >
                                                    <FileDownloadDoneIcon
                                                        sx={{ color: category.color, fontSize: 20 }}
                                                    />
                                                </Badge>
                                            </Tooltip>
                                        )}

                                        {/* Botão de copiar */}
                                        {renderCopyButton(category.id)}
                                    </Box>
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
                                    {/* Primeiro renderiza os exames padrão da categoria */}
                                    {category.exams.map((examName, index) => {
                                        const value = results[category.id]?.[examName] || '';
                                        const isAiFilled = isAiFilledValue(category.id, examName);
                                        const isFocused = focusedField.category === category.id && focusedField.exam === examName;

                                        return (
                                            <Box
                                                key={examName}
                                                sx={{
                                                    p: 2,
                                                    display: 'flex',
                                                    borderBottom: `1px solid ${alpha(category.color, 0.1)}`,
                                                    '&:hover': {
                                                        backgroundColor: alpha(category.color, 0.03)
                                                    },
                                                    transition: 'background-color 0.2s ease',
                                                    backgroundColor: isAiFilled
                                                        ? alpha(theme.palette.primary.main, 0.08)
                                                        : isFocused
                                                            ? alpha(category.color, 0.05)
                                                            : 'transparent'
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
                                                    {isAiFilled && (
                                                        <Tooltip title="Detectado pela IA">
                                                            <AutoAwesomeIcon
                                                                fontSize="small"
                                                                color="primary"
                                                                sx={{ ml: 1, fontSize: 16 }}
                                                            />
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                                <Box sx={{ width: '40%' }}>
                                                    <TextField
                                                        fullWidth
                                                        size="small"
                                                        placeholder="Preencher"
                                                        value={value}
                                                        onChange={(e) => handleUpdateExamResult(category.id, examName, e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(e, category.id, index, examName)}
                                                        onFocus={() => setFocusedField({ category: category.id, exam: examName })}
                                                        onBlur={() => setFocusedField({ category: '', exam: '' })}
                                                        inputRef={(el) => textFieldRefs.current[`${category.id}-${examName}`] = el}
                                                        disabled={readOnly}
                                                        sx={{
                                                            '& .MuiOutlinedInput-root': {
                                                                borderRadius: '8px',
                                                                transition: 'all 0.2s ease',
                                                                backgroundColor: value ? alpha('#FFFFFF', 0.9) : 'transparent',
                                                                '&:hover fieldset': {
                                                                    borderColor: alpha(category.color, 0.5),
                                                                },
                                                                '&.Mui-focused fieldset': {
                                                                    borderColor: category.color,
                                                                    borderWidth: '1px',
                                                                    boxShadow: `0 0 0 3px ${alpha(category.color, 0.2)}`
                                                                },
                                                                ...(isAiFilled && {
                                                                    backgroundColor: alpha(theme.palette.primary.light, 0.2),
                                                                    animation: 'pulse 2s infinite'
                                                                })
                                                            }
                                                        }}
                                                        InputProps={{
                                                            endAdornment: value ? (
                                                                <InputAdornment position="end">
                                                                    <Tooltip title="Limpar">
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => handleUpdateExamResult(category.id, examName, '')}
                                                                            edge="end"
                                                                        >
                                                                            <ClearIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </InputAdornment>
                                                            ) : null
                                                        }}
                                                    />
                                                </Box>
                                            </Box>
                                        );
                                    })}

                                    {/* Agora, renderiza TAMBÉM todos os exames encontrados pela IA que não estão na lista padrão */}
                                    {results[category.id] && Object.entries(results[category.id])
                                        .filter(([examName]) => !category.exams.includes(examName))
                                        .map(([examName, value], index) => {
                                            const isAiFilled = true; // Todos os campos não-padrão são considerados como detectados pela IA
                                            const isFocused = focusedField.category === category.id && focusedField.exam === examName;

                                            return (
                                                <Box
                                                    key={`dynamic-${examName}`}
                                                    sx={{
                                                        p: 2,
                                                        display: 'flex',
                                                        borderBottom: `1px solid ${alpha(category.color, 0.1)}`,
                                                        '&:hover': {
                                                            backgroundColor: alpha(category.color, 0.03)
                                                        },
                                                        transition: 'background-color 0.2s ease',
                                                        backgroundColor: alpha(theme.palette.primary.main, 0.08), // Destacar campos detectados pela IA
                                                        borderLeft: `4px solid ${theme.palette.primary.main}`
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
                                                        <Tooltip title="Detectado pela IA">
                                                            <AutoAwesomeIcon
                                                                fontSize="small"
                                                                color="primary"
                                                                sx={{ ml: 1, fontSize: 16 }}
                                                            />
                                                        </Tooltip>
                                                    </Box>
                                                    <Box sx={{ width: '40%' }}>
                                                        <TextField
                                                            fullWidth
                                                            size="small"
                                                            placeholder="Preencher"
                                                            value={value}
                                                            onChange={(e) => handleUpdateExamResult(category.id, examName, e.target.value)}
                                                            onFocus={() => setFocusedField({ category: category.id, exam: examName })}
                                                            onBlur={() => setFocusedField({ category: '', exam: '' })}
                                                            inputRef={(el) => textFieldRefs.current[`${category.id}-${examName}`] = el}
                                                            disabled={readOnly}
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    borderRadius: '8px',
                                                                    transition: 'all 0.2s ease',
                                                                    backgroundColor: alpha(theme.palette.primary.light, 0.2),
                                                                    animation: 'pulse 2s infinite',
                                                                    '&:hover fieldset': {
                                                                        borderColor: alpha(category.color, 0.5),
                                                                    },
                                                                    '&.Mui-focused fieldset': {
                                                                        borderColor: category.color,
                                                                        borderWidth: '1px',
                                                                        boxShadow: `0 0 0 3px ${alpha(category.color, 0.2)}`
                                                                    }
                                                                }
                                                            }}
                                                            InputProps={{
                                                                endAdornment: value ? (
                                                                    <InputAdornment position="end">
                                                                        <Tooltip title="Limpar">
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={() => handleUpdateExamResult(category.id, examName, '')}
                                                                                edge="end"
                                                                            >
                                                                                <ClearIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </InputAdornment>
                                                                ) : null
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                            );
                                        })
                                    }

                                    {/* Mensagem quando não há exames na busca */}
                                    {category.exams.length === 0 && (
                                        <Box sx={{
                                            p: 3,
                                            textAlign: 'center',
                                            color: theme.palette.text.secondary
                                        }}>
                                            <WarningIcon sx={{ fontSize: 36, color: theme.palette.grey[400], mb: 1 }} />
                                            <Typography>
                                                Nenhum exame encontrado nesta categoria.
                                            </Typography>
                                        </Box>
                                    )}
                                </Paper>
                            </AccordionDetails>
                        </Accordion>
                    );
                })}

                {/* Mensagem quando não há resultados de busca */}
                {filteredCategories.length === 0 && (
                    <Box sx={{
                        p: 4,
                        textAlign: 'center',
                        border: '1px dashed #ccc',
                        borderRadius: '12px',
                        color: theme.palette.text.secondary
                    }}>
                        <SearchIcon sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 2 }} />
                        <Typography variant="h6">
                            Nenhum exame encontrado
                        </Typography>
                        <Typography>
                            Tente outro termo de busca ou limpe o filtro.
                        </Typography>
                        <Button
                            variant="outlined"
                            sx={{ mt: 2 }}
                            onClick={() => setSearchTerm('')}
                            startIcon={<ClearIcon />}
                        >
                            Limpar busca
                        </Button>
                    </Box>
                )}
            </Box>

            {/* Dica de uso do Enter */}
            {!readOnly && expandedCategory && (
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mt: -2,
                    mb: 2
                }}>
                    <Chip
                        icon={<ArrowDownwardIcon fontSize="small" />}
                        label="Pressione Enter para avançar para o próximo campo"
                        variant="outlined"
                        color="primary"
                        sx={{ bgcolor: alpha(theme.palette.primary.light, 0.1) }}
                    />
                </Box>
            )}

            {/* Estilo para animação de destaque da IA */}
            <style jsx global>{`
                @keyframes pulse {
                    0% {
                        box-shadow: 0 0 0 0 rgba(24, 82, 254, 0.4);
                    }
                    70% {
                        box-shadow: 0 0 0 6px rgba(24, 82, 254, 0);
                    }
                    100% {
                        box-shadow: 0 0 0 0 rgba(24, 82, 254, 0);
                    }
                }
            `}</style>
        </Box>
    );
};

export default ExamTable;