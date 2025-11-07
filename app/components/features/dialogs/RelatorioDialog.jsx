"use client";
import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    Button,
    IconButton,
    Avatar,
    CircularProgress,
    Divider,
    Paper,
    useTheme,
    useMediaQuery
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import WarningIcon from '@mui/icons-material/Warning';
import BiotechIcon from '@mui/icons-material/Biotech';
import MedicationIcon from '@mui/icons-material/Medication';
import CheckIcon from '@mui/icons-material/Check';
import RecommendIcon from '@mui/icons-material/Recommend';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const RelatorioDialog = ({
                             open,
                             onClose,
                             relatorioData,
                             patientData,
                             onGenerate,
                             isLoading
                         }) => {
    const [isExporting, setIsExporting] = useState(false);
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    // Função para formatar a data
    const formatDate = (dateString) => {
        if (!dateString) return "-";

        try {
            const date = new Date(dateString);
            return format(date, 'dd/MM/yyyy', { locale: ptBR });
        } catch (error) {
            return dateString;
        }
    };

    const handleExportPDF = () => {
        setIsExporting(true);

        import('jspdf').then(({ default: jsPDF }) => {
            try {
                // Tentar importar o plugin de autotable
                require('jspdf-autotable');
            } catch (e) {
                console.warn("jspdf-autotable não encontrado, prosseguindo sem ele");
            }

            try {
                // Informações do paciente
                const patientName = patientData?.nome || patientData?.patientName || "Paciente";
                const patientBirthDate = formatDate(patientData?.dataNascimento || patientData?.birthDate);
                const reportDate = formatDate(relatorioData?.generatedAt || new Date().toISOString());

                // Criar documento PDF
                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                // Definir cores consistentes
                const primaryColor = "#8B5CF6"; // Cor do tema insight
                const textColor = "#344054";
                const headerBgColor = "#F3E8FF"; // Cor de fundo do header insight

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
                        doc.text(`Gerado em: ${reportDate}`, margin, pageHeight - 10);
                    }
                };

                // ----- CABEÇALHO -----
                doc.setFillColor(headerBgColor);
                doc.rect(0, 0, pageWidth, 40, 'F');

                doc.setDrawColor(primaryColor);
                doc.setLineWidth(0.5);
                doc.line(margin, 40, pageWidth - margin, 40);

                doc.setFontSize(18);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(primaryColor);
                doc.text("RESUMO CLÍNICO", margin, 15);

                doc.setFontSize(12);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(textColor);
                doc.text(`Paciente: ${patientName}`, margin, 25);

                if (patientBirthDate && patientBirthDate !== "-") {
                    doc.text(`Data de Nascimento: ${patientBirthDate}`, margin, 32);
                }

                // ----- CONTEÚDO DO RELATÓRIO -----
                let yPosition = 50;

                // Perfil Médico
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(primaryColor);
                doc.text("Perfil Médico", margin, yPosition);

                yPosition += 10;

                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(textColor);

                // Texto do perfil médico com quebra de linhas
                const profileText = relatorioData?.profileSummary || "Informações insuficientes para gerar perfil médico.";
                const profileLines = doc.splitTextToSize(profileText, contentWidth);
                doc.text(profileLines, margin, yPosition);

                yPosition += (profileLines.length * 7) + 10;

                // Alerts (Pontos de Atenção)
                if (relatorioData?.alerts && relatorioData.alerts.length > 0) {
                    // Verificar se precisa de nova página
                    if (yPosition > pageHeight - 60) {
                        doc.addPage();
                        yPosition = 20;
                    }

                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor('#EF4444');
                    doc.text("Pontos de Atenção", margin, yPosition);

                    yPosition += 10;

                    // Listar alertas
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(textColor);

                    for (let i = 0; i < relatorioData.alerts.length; i++) {
                        const alert = relatorioData.alerts[i];
                        const alertLines = doc.splitTextToSize(`• ${alert}`, contentWidth - 5);
                        doc.text(alertLines, margin + 5, yPosition);
                        yPosition += (alertLines.length * 7) + 5;

                        if (yPosition > pageHeight - 30 && i < relatorioData.alerts.length - 1) {
                            doc.addPage();
                            yPosition = 20;
                        }
                    }

                    yPosition += 5;
                }

                // Análise de Exames
                if (relatorioData?.examAnalysis) {
                    // Verificar se precisa de nova página
                    if (yPosition > pageHeight - 60) {
                        doc.addPage();
                        yPosition = 20;
                    }

                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor('#0891B2');
                    doc.text("Análise de Exames", margin, yPosition);

                    yPosition += 10;

                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(textColor);

                    const examLines = doc.splitTextToSize(relatorioData.examAnalysis, contentWidth);
                    doc.text(examLines, margin, yPosition);

                    yPosition += (examLines.length * 7) + 10;
                }

                // Análise de Medicações
                if (relatorioData?.medicationAnalysis) {
                    // Verificar se precisa de nova página
                    if (yPosition > pageHeight - 60) {
                        doc.addPage();
                        yPosition = 20;
                    }

                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor('#16A34A');
                    doc.text("Análise de Medicações", margin, yPosition);

                    yPosition += 10;

                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(textColor);

                    const medLines = doc.splitTextToSize(relatorioData.medicationAnalysis, contentWidth);
                    doc.text(medLines, margin, yPosition);

                    yPosition += (medLines.length * 7) + 10;
                }

                // Recomendações
                if (relatorioData?.recommendations && relatorioData.recommendations.length > 0) {
                    // Verificar se precisa de nova página
                    if (yPosition > pageHeight - 60) {
                        doc.addPage();
                        yPosition = 20;
                    }

                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor('#10B981');
                    doc.text("Recomendações", margin, yPosition);

                    yPosition += 10;

                    // Listar recomendações
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(textColor);

                    for (let i = 0; i < relatorioData.recommendations.length; i++) {
                        const rec = relatorioData.recommendations[i];
                        const recLines = doc.splitTextToSize(`• ${rec}`, contentWidth - 5);
                        doc.text(recLines, margin + 5, yPosition);
                        yPosition += (recLines.length * 7) + 5;

                        if (yPosition > pageHeight - 30 && i < relatorioData.recommendations.length - 1) {
                            doc.addPage();
                            yPosition = 20;
                        }
                    }

                    yPosition += 5;
                }

                // Adicionar data de geração e notas importantes no final
                if (yPosition > pageHeight - 40) {
                    doc.addPage();
                    yPosition = 20;
                }

                doc.setFontSize(10);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(100, 100, 100);
                doc.text(
                    "Nota: Este resumo clínico é gerado automaticamente a partir dos dados disponíveis e destina-se apenas como auxílio para o profissional de saúde.",
                    margin,
                    yPosition
                );

                yPosition += 7;

                doc.text(
                    "Todas as decisões clínicas devem ser tomadas com base no julgamento profissional e outros dados relevantes do paciente.",
                    margin,
                    yPosition
                );

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

                // Limpeza de URL
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

    // Verificar se temos dados para mostrar
    const noDataAvailable = !relatorioData || Object.keys(relatorioData).length === 0;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            fullScreen={fullScreen}
            PaperProps={{
                sx: {
                    borderRadius: fullScreen ? 0 : '20px',
                    overflow: 'hidden',
                    boxShadow: fullScreen ? 'none' : '0px 4px 30px rgba(0, 0, 0, 0.08)',
                    maxHeight: fullScreen ? '100vh' : '90vh',
                    // Melhorar responsividade mobile
                    [theme.breakpoints.down('sm')]: {
                        margin: 0,
                        borderRadius: 0,
                        width: '100%',
                        height: '100%',
                        maxHeight: '100vh',
                        maxWidth: '100vw',
                    },
                    [theme.breakpoints.between('sm', 'md')]: {
                        margin: '12px',
                        borderRadius: '20px',
                        width: 'calc(100% - 24px)',
                        maxWidth: '800px',
                    },
                }
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    p: { xs: 2, sm: 3 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #EAECEF',
                    backgroundColor: '#F3E8FF'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                        sx={{
                            bgcolor: '#8B5CF6',
                            color: 'white',
                            width: { xs: 32, sm: 40 },
                            height: { xs: 32, sm: 40 },
                            mr: { xs: 1.5, sm: 2 }
                        }}
                    >
                        <PsychologyAltIcon />
                    </Avatar>
                    <Box>
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                fontWeight: 600, 
                                color: '#8B5CF6',
                                fontSize: { xs: '1rem', sm: '1.25rem' }
                            }}
                        >
                            Resumo Clínico Inteligente
                        </Typography>
                        {relatorioData?.generatedAt && (
                            <Typography 
                                variant="body2" 
                                color="textSecondary"
                                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                            >
                                Gerado em: {formatDate(relatorioData.generatedAt)}
                            </Typography>
                        )}
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: '#64748B' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Body */}
            <DialogContent sx={{ p: 0 }}>
                {isLoading ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 5,
                            minHeight: '300px'
                        }}
                    >
                        <CircularProgress size={60} sx={{ color: '#8B5CF6', mb: 3 }} />
                        <Typography variant="h6" sx={{ mb: 1, color: '#8B5CF6', fontWeight: 500 }}>
                            Gerando Resumo Clínico
                        </Typography>
                        <Typography variant="body2" color="textSecondary" align="center">
                            Analisando dados do paciente e preparando insights clínicos...
                        </Typography>
                    </Box>
                ) : noDataAvailable ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 5,
                            minHeight: '300px'
                        }}
                    >
                        <PsychologyAltIcon sx={{ fontSize: 60, color: '#8B5CF6', opacity: 0.3, mb: 2 }} />
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 500 }}>
                            Nenhum dado disponível
                        </Typography>
                        <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
                            Ainda não foi gerado um resumo clínico para este paciente.
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AutoAwesomeIcon />}
                            onClick={onGenerate}
                            sx={{
                                bgcolor: '#8B5CF6',
                                '&:hover': {
                                    bgcolor: '#7C3AED'
                                }
                            }}
                        >
                            Gerar Resumo Clínico
                        </Button>
                    </Box>
                ) : (
                    <Box
                        sx={{
                            height: '100%',
                            overflow: 'auto',
                            bgcolor: '#F9F5FF',
                        }}
                    >
                        {/* Perfil Médico */}
                        <Box sx={{ p: 3, borderBottom: '1px solid #EAECEF', backgroundColor: 'white' }}>
                            <Typography variant="h6" sx={{
                                fontSize: '18px',
                                fontWeight: 600,
                                color: '#8B5CF6',
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2
                            }}>
                                <PsychologyAltIcon sx={{ mr: 1 }} />
                                Perfil Médico
                            </Typography>

                            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                                {relatorioData.profileSummary || 'Informações insuficientes para gerar perfil médico.'}
                            </Typography>
                        </Box>

                        {/* Pontos de Atenção */}
                        {relatorioData.alerts && relatorioData.alerts.length > 0 && (
                            <Box sx={{ p: 3, borderBottom: '1px solid #EAECEF', backgroundColor: 'white' }}>
                                <Typography variant="h6" sx={{
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    color: '#EF4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: 2
                                }}>
                                    <WarningIcon sx={{ mr: 1 }} />
                                    Pontos de Atenção
                                </Typography>

                                <Box sx={{
                                    p: 2,
                                    bgcolor: '#FEF2F2',
                                    borderRadius: '10px',
                                    border: '1px solid #FEE2E2'
                                }}>
                                    {relatorioData.alerts.map((alert, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                mb: index < relatorioData.alerts.length - 1 ? 2 : 0,
                                                pb: index < relatorioData.alerts.length - 1 ? 2 : 0,
                                                borderBottom: index < relatorioData.alerts.length - 1 ? '1px solid #FEE2E2' : 'none'
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    minWidth: '28px',
                                                    height: '28px',
                                                    borderRadius: '50%',
                                                    bgcolor: '#FEE2E2',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    mr: 2,
                                                    mt: 0.5
                                                }}
                                            >
                                                <WarningIcon sx={{ color: '#EF4444', fontSize: '16px' }} />
                                            </Box>
                                            <Typography variant="body1" sx={{ color: '#B91C1C' }}>
                                                {alert}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* Análise de Exames */}
                        {relatorioData.examAnalysis && (
                            <Box sx={{ p: 3, borderBottom: '1px solid #EAECEF', backgroundColor: 'white' }}>
                                <Typography variant="h6" sx={{
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    color: '#0891B2',
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: 2
                                }}>
                                    <BiotechIcon sx={{ mr: 1 }} />
                                    Análise de Exames
                                </Typography>

                                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                                    {relatorioData.examAnalysis}
                                </Typography>
                            </Box>
                        )}

                        {/* Análise de Medicações */}
                        {relatorioData.medicationAnalysis && (
                            <Box sx={{ p: 3, borderBottom: '1px solid #EAECEF', backgroundColor: 'white' }}>
                                <Typography variant="h6" sx={{
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    color: '#16A34A',
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: 2
                                }}>
                                    <MedicationIcon sx={{ mr: 1 }} />
                                    Análise de Medicações
                                </Typography>

                                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                                    {relatorioData.medicationAnalysis}
                                </Typography>
                            </Box>
                        )}

                        {/* Recomendações */}
                        {relatorioData.recommendations && relatorioData.recommendations.length > 0 && (
                            <Box sx={{ p: 3, backgroundColor: 'white' }}>
                                <Typography variant="h6" sx={{
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    color: '#10B981',
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: 2
                                }}>
                                    <RecommendIcon sx={{ mr: 1 }} />
                                    Recomendações
                                </Typography>

                                <Box sx={{
                                    p: 2,
                                    bgcolor: '#ECFDF5',
                                    borderRadius: '10px',
                                    border: '1px solid #D1FAE5'
                                }}>
                                    {relatorioData.recommendations.map((rec, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                mb: index < relatorioData.recommendations.length - 1 ? 2 : 0,
                                                pb: index < relatorioData.recommendations.length - 1 ? 2 : 0,
                                                borderBottom: index < relatorioData.recommendations.length - 1 ? '1px solid #D1FAE5' : 'none'
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    minWidth: '28px',
                                                    height: '28px',
                                                    borderRadius: '50%',
                                                    bgcolor: '#D1FAE5',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    mr: 2,
                                                    mt: 0.5
                                                }}
                                            >
                                                <CheckIcon sx={{ color: '#10B981', fontSize: '16px' }} />
                                            </Box>
                                            <Typography variant="body1" sx={{ color: '#047857' }}>
                                                {rec}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* Informação legal no final */}
                        <Box sx={{ p: 3, bgcolor: '#F9F5FF' }}>
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1, fontStyle: 'italic' }}>
                                Nota: Este resumo clínico é gerado automaticamente a partir dos dados disponíveis e destina-se apenas como auxílio para o profissional de saúde.
                            </Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                                Todas as decisões clínicas devem ser tomadas com base no julgamento profissional e outros dados relevantes do paciente.
                            </Typography>
                        </Box>
                    </Box>
                )}
            </DialogContent>

            {/* Footer */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                p: 2.5,
                borderTop: '1px solid #EAECEF',
                backgroundColor: 'white'
            }}>
                <Button
                    variant="outlined"
                    onClick={onClose}
                    sx={{
                        borderColor: '#D0D5DD',
                        color: '#344054',
                        '&:hover': {
                            borderColor: '#B0B7C3',
                            backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        }
                    }}
                >
                    Fechar
                </Button>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    {!noDataAvailable && !isLoading && (
                        <Button
                            variant="outlined"
                            startIcon={<AutoAwesomeIcon />}
                            onClick={onGenerate}
                            disabled={isLoading || isExporting}
                            sx={{
                                borderColor: '#8B5CF6',
                                color: '#8B5CF6',
                                '&:hover': {
                                    borderColor: '#7C3AED',
                                    backgroundColor: 'rgba(139, 92, 246, 0.04)',
                                }
                            }}
                        >
                            Gerar Novamente
                        </Button>
                    )}

                    {!noDataAvailable && !isLoading && (
                        <Button
                            variant="contained"
                            startIcon={<PictureAsPdfIcon />}
                            onClick={handleExportPDF}
                            disabled={isLoading || isExporting}
                            sx={{
                                bgcolor: '#8B5CF6',
                                '&:hover': {
                                    bgcolor: '#7C3AED'
                                }
                            }}
                        >
                            {isExporting ? 'Exportando...' : 'Exportar PDF'}
                        </Button>
                    )}
                </Box>
            </Box>
        </Dialog>
    );
};

export default RelatorioDialog;