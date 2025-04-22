"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    Button,
    Chip,
    IconButton,
    Divider,
    Grid,
    Paper,
    Tooltip,
    Slide,
    Fade,
    Avatar,
    Card,
    CardContent,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    useTheme,
    useMediaQuery
} from "@mui/material";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

// Ícones
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import MedicationIcon from "@mui/icons-material/Medication";
import EventNoteIcon from "@mui/icons-material/EventNote";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import BiotechIcon from "@mui/icons-material/Biotech";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import ShareIcon from "@mui/icons-material/Share";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LinkIcon from "@mui/icons-material/Link";
import ImageIcon from "@mui/icons-material/Image";
import ArticleIcon from "@mui/icons-material/Article";
import WarningIcon from "@mui/icons-material/Warning";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Serviço Firebase
import FirebaseService from "../../../lib/firebaseService";
import AnamneseViewer from "./anamneseViwer";
import ReceitaViewer from "./receitasViwer";
import ExameViewer from "./examViwer"
import jsPDF from "jspdf";
import ExamViewer from "./examViwer";

// Tema com cores para cada tipo de nota
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1852FE',
            light: '#ECF1FF',
        },
        note: {
            main: '#1852FE',  // Azul para notas
            light: '#ECF1FF',
            dark: '#0A3CC9',
            contrastText: '#FFFFFF',
            background: '#F0F5FF',
        },
        anamnese: {
            main: '#6366F1',  // Roxo para anamneses
            light: '#EDEDFF',
            dark: '#4338CA',
            contrastText: '#FFFFFF',
            background: '#F5F5FF',
        },
        receita: {
            main: '#22C55E',  // Verde para receitas
            light: '#ECFDF5',
            dark: '#16A34A',
            contrastText: '#FFFFFF',
            background: '#F0FFF4',
        },
        exame: {
            main: '#F59E0B',  // Amarelo para exames
            light: '#FEF9C3',
            dark: '#D97706',
            contrastText: '#FFFFFF',
            background: '#FFFBEB',
        },
        // Novas cores para categorias
        categoria: {
            Geral: {
                main: '#1852FE',
                light: '#ECF1FF',
                dark: '#0A3CC9',
                background: '#F0F5FF',
            },
            Exames: {
                main: '#F59E0B',
                light: '#FEF9C3',
                dark: '#D97706',
                background: '#FFFBEB',
            },
            Laudos: {
                main: '#F43F5E',
                light: '#FEE2E2',
                dark: '#E11D48',
                background: '#FFF1F2',
            },
            Receitas: {
                main: '#22C55E',
                light: '#ECFDF5',
                dark: '#16A34A',
                background: '#F0FFF4',
            },
            Atestados: {
                main: '#8B5CF6',
                light: '#F3E8FF',
                dark: '#7C3AED',
                background: '#F5F3FF',
            },
            Imagens: {
                main: '#10B981',
                light: '#D1FAE5',
                dark: '#059669',
                background: '#ECFDF5',
            },
            Consultas: {
                main: '#3B82F6',
                light: '#DBEAFE',
                dark: '#2563EB',
                background: '#EFF6FF',
            }
        },
        grey: {
            100: '#F6F7F9',
            200: '#EAECEF',
            300: '#DFE3EB',
            400: '#94A3B8',
            500: '#64748B',
            800: '#344054',
        }
    },
    typography: {
        fontFamily: '"Gellix", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 20,
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 50,
                }
            }
        },
        MuiDivider: {
            styleOverrides: {
                root: {
                    margin: '16px 0',
                }
            }
        }
    }
});

// Transição para o Dialog
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

// Função para determinar o tipo de arquivo
const getFileTypeInfo = (fileName, fileType) => {
    if (!fileName) return { icon: <ArticleIcon />, color: "#94A3B8" };

    if (fileType && fileType.startsWith('image/') ||
        fileName.toLowerCase().endsWith('.jpg') ||
        fileName.toLowerCase().endsWith('.jpeg') ||
        fileName.toLowerCase().endsWith('.png') ||
        fileName.toLowerCase().endsWith('.gif')) {
        return { icon: <ImageIcon />, color: "#10B981" };
    }

    if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
        return { icon: <PictureAsPdfIcon />, color: "#EF4444" };
    }

    return { icon: <ArticleIcon />, color: "#3B82F6" };
};

const ViewNoteDialog = ({
                            open,
                            onClose,
                            noteData,
                            noteType,
                            patientId,
                            doctorId,
                            onEdit,
                            onDelete
                        }) => {
    const [loading, setLoading] = useState(false);
    const [patientData, setPatientData] = useState(null);
    const [expanded, setExpanded] = useState({});
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    const muiTheme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

    // Cores por tipo de nota
    const getTypeColor = (type) => {
        switch(type) {
            case 'Anamnese':
                return theme.palette.anamnese;
            case 'Receita':
                return theme.palette.receita;
            case 'Exame':
                return theme.palette.exame;
            default:
                return theme.palette.note;
        }
    };

    // Cores por categoria de nota
    const getCategoryColor = (category) => {
        if (!category) return theme.palette.categoria.Geral;
        return theme.palette.categoria[category] || theme.palette.categoria.Geral;
    };

    // Ícone por tipo de nota
    const getTypeIcon = (type) => {
        switch(type) {
            case 'Anamnese':
                return <HistoryEduIcon />;
            case 'Receita':
                return <MedicationIcon />;
            case 'Exame':
                return <BiotechIcon />;
            case 'Consulta':
                return <EventNoteIcon />;
            default:
                return <AssignmentIcon />;
        }
    };

    // Ícone por categoria
    const getCategoryIcon = (category) => {
        switch(category) {
            case 'Receitas':
                return <MedicationIcon />;
            case 'Exames':
                return <BiotechIcon />;
            case 'Laudos':
                return <AssignmentIcon />;
            case 'Atestados':
                return <HistoryEduIcon />;
            case 'Consultas':
                return <EventNoteIcon />;
            case 'Imagens':
                return <ImageIcon />;
            default:
                return <ArticleIcon />;
        }
    };

    // Formato do tipo de nota
    const getTypeLabel = (type) => {
        switch(type) {
            case 'Anamnese':
                return 'Anamnese';
            case 'Receita':
                return 'Receita Médica';
            case 'Exame':
                return 'Exame';
            case 'Consulta':
                return 'Nota de Consulta';
            case 'Rápida':
                return 'Nota Rápida';
            default:
                return 'Nota';
        }
    };

    // Busca dados do paciente
    useEffect(() => {
        const fetchPatientData = async () => {
            if (open && patientId && doctorId) {
                setLoading(true);
                try {
                    const data = await FirebaseService.getPatient(doctorId, patientId);
                    setPatientData(data);
                } catch (error) {
                    console.error("Erro ao buscar dados do paciente:", error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchPatientData();
    }, [open, patientId, doctorId]);

    // Formatação de data
    const formatDate = (date) => {
        if (!date) return "";
        const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
        return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    };

    const formatDateTime = (date) => {
        if (!date) return "";
        const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
        return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    };

    const formatTimeAgo = (date) => {
        if (!date) return "";
        const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
        return formatDistanceToNow(dateObj, { addSuffix: true, locale: ptBR });
    };

    const getPatientName = () => {
        if (!patientData) return "Carregando...";
        return patientData.nome || patientData.patientName || "Paciente";
    };

    const handleToggleExpand = (section) => {
        setExpanded(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };


    const handleOpenPdf = () => {
        // Se já existe um PDF salvo, abre normalmente
        if (noteData.pdfUrl) {
            window.open(noteData.pdfUrl, '_blank');
            return;
        }

        // Se não há PDF pré-gerado e a nota é uma receita, gera dinamicamente
        if (noteType === 'Receita') {
            generateAndOpenPdf();
        }
    };



// Versão corrigida do generateAndOpenPdf sem referências a toast
    const generateAndOpenPdf = () => {
        try {
            // Gerar PDF baseado nos dados da receita
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            let yPos = 20;

            // Helper para adicionar texto com quebra automática
            const addWrappedText = (text, x, y, maxWidth, lineHeight = 7) => {
                if (!text) return y;
                const lines = doc.splitTextToSize(text, maxWidth);
                doc.text(lines, x, y);
                return y + (lines.length * lineHeight);
            };

            // Cabeçalho
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');

            // Adiciona a palavra "RECEITA" centralizada e em negrito
            const tipoText = noteData.tipo === "controlada" ? "RECEITA CONTROLADA" :
                noteData.tipo === "especial" ? "RECEITA ESPECIAL" :
                    noteData.tipo === "antimicrobiano" ? "RECEITA DE ANTIMICROBIANO" :
                        "RECEITA MÉDICA";

            doc.text(tipoText, pageWidth / 2, yPos, { align: 'center' });
            yPos += 15;

            // Dados do médico
            const doctorName = noteData.doctorName || "Dr(a).";
            const doctorCRM = noteData.doctorCRM || "CRM:";
            const doctorSpecialty = noteData.doctorSpecialty || "";

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`${doctorName}`, margin, yPos);
            yPos += 7;

            doc.setFont('helvetica', 'normal');
            doc.text(`${doctorCRM}`, margin, yPos);

            if (doctorSpecialty) {
                yPos += 7;
                doc.text(`${doctorSpecialty}`, margin, yPos);
            }

            yPos += 10;

            // Linha separadora
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 15;

            // Título da receita se disponível
            if (noteData.titulo || noteData.noteTitle) {
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                const titulo = noteData.titulo || noteData.noteTitle;
                doc.text(titulo, margin, yPos);
                yPos += 10;
            }

            // Dados do paciente e da receita
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Paciente: ${getPatientName()}`, margin, yPos);
            yPos += 7;

            if (patientData && patientData.dataNascimento) {
                const dataNasc = patientData.dataNascimento instanceof Date ?
                    patientData.dataNascimento :
                    patientData.dataNascimento.toDate ?
                        patientData.dataNascimento.toDate() :
                        new Date(patientData.dataNascimento);

                const idade = Math.floor((new Date() - dataNasc) / (365.25 * 24 * 60 * 60 * 1000));
                doc.text(`Idade: ${idade} anos`, margin, yPos);
                yPos += 7;
            }

            doc.setFont('helvetica', 'normal');

            // Data de emissão e validade
            doc.text(`Data de emissão: ${formatDate(noteData.dataEmissao || noteData.createdAt)}`, margin, yPos);
            yPos += 7;

            if (noteData.dataValidade) {
                doc.text(`Válida até: ${formatDate(noteData.dataValidade)}`, margin, yPos);
                yPos += 7;
            }

            // Linha separadora
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 15;

            // Medicamentos
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text("PRESCRIÇÃO:", margin, yPos);
            yPos += 10;

            // Lista de medicamentos
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');

            const medicamentos = noteData.medicamentos || noteData.medications || [];

            if (medicamentos.length === 0) {
                doc.text("Nenhum medicamento prescrito", margin, yPos);
                yPos += 10;
            } else {
                medicamentos.forEach((med, index) => {
                    if (yPos > pageHeight - 40) {
                        doc.addPage();
                        yPos = 20;
                    }

                    // Normaliza nomes de campos para compatibilidade
                    const nome = med.nome || med.medicationName || med.name || '';
                    const concentracao = med.concentracao || med.dosage || '';
                    const posologia = med.posologia || med.frequency || '';
                    const duracao = med.duracao || med.duration || '';
                    const quantidade = med.quantidade || med.quantity || '';
                    const observacao = med.observacao || med.observation || '';

                    doc.setFont('helvetica', 'bold');
                    doc.text(`${index + 1}. ${nome}${concentracao ? ` ${concentracao}` : ''}`, margin, yPos);
                    yPos += 7;

                    doc.setFont('helvetica', 'normal');
                    if (posologia) {
                        yPos = addWrappedText(`Posologia: ${posologia}`, margin + 5, yPos, pageWidth - (2 * margin) - 5) + 5;
                    }

                    if (quantidade) {
                        yPos = addWrappedText(`Quantidade: ${quantidade}`, margin + 5, yPos, pageWidth - (2 * margin) - 5) + 5;
                    }

                    if (duracao) {
                        yPos = addWrappedText(`Duração: ${duracao}`, margin + 5, yPos, pageWidth - (2 * margin) - 5) + 5;
                    }

                    if (observacao) {
                        yPos = addWrappedText(`Observação: ${observacao}`, margin + 5, yPos, pageWidth - (2 * margin) - 5) + 5;
                    }

                    yPos += 5;
                });
            }

            // Orientação geral e observações
            if (noteData.orientacaoGeral) {
                if (yPos > pageHeight - 60) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setDrawColor(200, 200, 200);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 10;

                doc.setFont('helvetica', 'bold');
                doc.text("Orientações Gerais:", margin, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                yPos = addWrappedText(noteData.orientacaoGeral, margin, yPos, pageWidth - (2 * margin)) + 10;
            }

            // Incluir texto da nota se disponível e não for duplicação das orientações
            if (noteData.noteText &&
                noteData.noteText !== noteData.orientacaoGeral &&
                !medicamentos.some(med => noteData.noteText.includes(med.nome || med.medicationName || med.name || ''))) {

                if (yPos > pageHeight - 60) {
                    doc.addPage();
                    yPos = 20;
                }

                if (!noteData.orientacaoGeral) {
                    doc.setDrawColor(200, 200, 200);
                    doc.line(margin, yPos, pageWidth - margin, yPos);
                    yPos += 10;
                }

                doc.setFont('helvetica', 'bold');
                doc.text("Observações Adicionais:", margin, yPos);
                yPos += 7;
                doc.setFont('helvetica', 'normal');
                yPos = addWrappedText(noteData.noteText, margin, yPos, pageWidth - (2 * margin)) + 10;
            }

            // Assinatura
            if (yPos > pageHeight - 50) {
                doc.addPage();
                yPos = 40;
            } else {
                yPos = pageHeight - 50;
            }

            // Local e data
            doc.setFont('helvetica', 'normal');
            const dataEmissao = noteData.dataEmissao || noteData.createdAt;
            const dataFormatada = dataEmissao ? formatDate(dataEmissao) : format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
            const localData = `Local, ${dataFormatada}`;
            doc.text(localData, pageWidth / 2, yPos - 10, { align: 'center' });

            // Linha para assinatura
            doc.setDrawColor(100, 100, 100);
            const signatureWidth = 100;
            const signatureX = (pageWidth - signatureWidth) / 2;
            doc.line(signatureX, yPos, signatureX + signatureWidth, yPos);
            yPos += 10;

            // Texto da assinatura
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`${doctorName}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 5;
            doc.text(`${doctorCRM}`, pageWidth / 2, yPos, { align: 'center' });

            if (doctorSpecialty) {
                yPos += 5;
                doc.text(`${doctorSpecialty}`, pageWidth / 2, yPos, { align: 'center' });
            }

            // Rodapé com numeração de páginas
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'italic');
                doc.text(
                    `Página ${i} de ${totalPages}`,
                    pageWidth - margin,
                    pageHeight - 10,
                    { align: 'right' }
                );

                // Adicionar aviso de uso nas páginas (se for controlada ou especial)
                if (noteData.tipo === "controlada" || noteData.tipo === "especial" || noteData.tipo === "antimicrobiano") {
                    const avisoText = noteData.tipo === "controlada" ?
                        "RECEITA SUJEITA A CONTROLE ESPECIAL" :
                        noteData.tipo === "especial" ?
                            "RECEITA DE MEDICAMENTO SUJEITO A CONTROLE ESPECIAL" :
                            "RECEITA DE ANTIMICROBIANO";

                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'bold');
                    doc.text(
                        avisoText,
                        margin,
                        pageHeight - 10,
                        { align: 'left' }
                    );
                }
            }

            // Tentativa de salvar o PDF no Firestore se necessário
            const savePdfToStorage = async () => {
                try {
                    if (doctorId && patientId && noteData.id) {
                        const pdfBlob = doc.output('blob');
                        const pdfFileName = `receitas/${doctorId}/${patientId}/${noteData.id}.pdf`;
                        const pdfUrl = await FirebaseService.uploadFile(pdfBlob, pdfFileName);

                        // Atualiza o registro da receita com o URL do PDF
                        await FirebaseService.updatePrescription(doctorId, patientId, noteData.id, {
                            pdfUrl: pdfUrl
                        });

                        console.log("PDF salvo no Storage com sucesso:", pdfUrl);
                    }
                } catch (error) {
                    console.error("Erro ao salvar PDF no Storage:", error);
                    // Não impede a exibição do PDF mesmo se falhar o salvamento
                }
            };

            // Tenta salvar o PDF no Storage em background, mas não espera para exibir
            savePdfToStorage();

            // Abrir PDF em uma nova janela
            window.open(URL.createObjectURL(doc.output('blob')), '_blank');

        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            // Notificação simples de erro
            alert("Erro ao gerar PDF. Tente novamente.");
        }
    };



    // Função corrigida para abrir anexos no ViewNoteDialog
    // Função definitiva para abrir anexos no ViewNoteDialog
    const handleOpenAttachment = (attachment) => {
        console.log("Visualizando anexo:", attachment);

        if (!attachment) {
            console.error("Anexo nulo ou indefinido");
            alert("Não foi possível abrir este anexo.");
            return;
        }

        // Imprime todos os detalhes do anexo para facilitar a depuração
        console.log("Detalhes do anexo:", JSON.stringify(attachment));

        // Verifica URL direta - abordagem principal
        if (attachment.fileUrl) {
            console.log("Abrindo anexo pela URL direta:", attachment.fileUrl);
            window.open(attachment.fileUrl, '_blank');
            return;
        }

        // Verifica campos alternativos de URL
        if (attachment.url) {
            console.log("Abrindo anexo pela propriedade url:", attachment.url);
            window.open(attachment.url, '_blank');
            return;
        }

        if (attachment.downloadURL) {
            console.log("Abrindo anexo pela propriedade downloadURL:", attachment.downloadURL);
            window.open(attachment.downloadURL, '_blank');
            return;
        }

        // Tenta acessar o armazenamento pelo caminho
        if (attachment.storagePath) {
            console.log("Tentando obter URL pelo storagePath:", attachment.storagePath);

            try {
                FirebaseService.getStorageFileUrl(attachment.storagePath)
                    .then(url => {
                        console.log("URL obtida com sucesso:", url);
                        window.open(url, '_blank');
                    })
                    .catch(error => {
                        console.error("Erro ao obter URL do Storage:", error);
                        alert("Não foi possível acessar este anexo.");
                    });
                return;
            } catch (error) {
                console.error("Erro ao processar caminho do storage:", error);
            }
        }

        // Tenta reconstruir o caminho do arquivo no Storage (melhorado)
        if (attachment.fileName && doctorId && patientId && noteData && noteData.id) {
            try {
                // Construção do caminho mais robusta, seguindo o padrão usado no upload
                const basePath = `users/${doctorId}/patients/${patientId}/notes/${noteData.id}`;
                const filePath = `${basePath}/${attachment.fileName}`;

                console.log("Tentando reconstruir caminho para:", filePath);

                FirebaseService.getStorageFileUrl(filePath)
                    .then(url => {
                        console.log("URL obtida pelo caminho reconstruído:", url);
                        window.open(url, '_blank');
                    })
                    .catch(err => {
                        console.error("Erro com caminho reconstruído:", err);

                        // Tenta com variações de caminho
                        const alternativePath = `notes/${doctorId}/${patientId}/${noteData.id}/${attachment.fileName}`;
                        console.log("Tentando caminho alternativo:", alternativePath);

                        return FirebaseService.getStorageFileUrl(alternativePath);
                    })
                    .then(url => {
                        if (url) {
                            console.log("URL obtida pelo caminho alternativo:", url);
                            window.open(url, '_blank');
                        }
                    })
                    .catch(error => {
                        console.error("Todas as tentativas de caminhos falharam:", error);
                        alert(`Não foi possível abrir o anexo: ${attachment.fileName}`);
                    });
                return;
            } catch (error) {
                console.error("Erro ao tentar acessar arquivo no storage:", error);
            }
        }

        // Tenta usar o objeto File diretamente (improvável em visualização, mas possível)
        if (attachment.file instanceof File) {
            console.log("Criando URL temporária para o arquivo:", attachment.fileName);
            const blobUrl = URL.createObjectURL(attachment.file);
            window.open(blobUrl, '_blank');

            // Libera a URL após uso
            setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
            return;
        }

        // Se todas as tentativas falharam
        console.error("Não foi possível determinar como abrir este anexo:", attachment);
        alert(`Não foi possível abrir este anexo: ${attachment.fileName || "Sem nome"}. Tente editar a nota e reenviar o arquivo.`);
    };

    const handleEdit = () => {
        if (onEdit) {
            onEdit(noteData);
        }
    };

    const handleDeleteClick = () => {
        setDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (onDelete) {
            onDelete(noteData.id);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirm(false);
    };

    const typeColor = getTypeColor(noteType);
    const typeIcon = getTypeIcon(noteType);
    const typeLabel = getTypeLabel(noteType);

    // Get category theme properties
    const categoryColor = getCategoryColor(noteData?.category);
    const categoryIcon = getCategoryIcon(noteData?.category);

    // Rendering da seção de medicamentos (para receitas)
    const renderMedicamentos = () => {
        if (!noteData.medicamentos && !noteData.medications) return null;

        const medicamentos = noteData.medicamentos || noteData.medications || [];

        if (medicamentos.length === 0) return null;

        return (
            <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{
                    fontWeight: 600,
                    color: typeColor.main,
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2
                }}>
                    <MedicationIcon sx={{ mr: 1 }} />
                    Medicamentos
                </Typography>

                {medicamentos.map((med, index) => {
                    // Normalize dos dados com base no formato (pode variar um pouco entre tipos)
                    const nome = med.nome || med.medicationName || med.name || '';
                    const concentracao = med.concentracao || med.dosage || '';
                    const posologia = med.posologia || med.frequency || '';
                    const duracao = med.duracao || med.duration || '';
                    const quantidade = med.quantidade || med.quantity || '';
                    const observacao = med.observacao || med.observation || '';

                    return (
                        <Card key={index} sx={{
                            mb: 2,
                            border: `1px solid ${typeColor.light}`,
                            boxShadow: 'none',
                            backgroundColor: alpha(typeColor.light, 0.5),
                            borderRadius: 2
                        }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.grey[800] }}>
                                            {nome}
                                            {concentracao && (
                                                <Typography component="span" sx={{ ml: 1, fontWeight: 500 }}>
                                                    {concentracao}
                                                </Typography>
                                            )}
                                        </Typography>

                                        {posologia && (
                                            <Typography variant="body1" sx={{ mt: 1, color: theme.palette.grey[700] }}>
                                                <strong>Posologia:</strong> {posologia}
                                            </Typography>
                                        )}

                                        <Grid container spacing={2} sx={{ mt: 1 }}>
                                            {quantidade && (
                                                <Grid item>
                                                    <Chip
                                                        label={`Quantidade: ${quantidade}`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: alpha(typeColor.light, 0.7),
                                                            borderRadius: '8px',
                                                            fontWeight: 500,
                                                            color: typeColor.dark
                                                        }}
                                                    />
                                                </Grid>
                                            )}

                                            {duracao && (
                                                <Grid item>
                                                    <Chip
                                                        label={`Duração: ${duracao}`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: alpha(typeColor.light, 0.7),
                                                            borderRadius: '8px',
                                                            fontWeight: 500,
                                                            color: typeColor.dark
                                                        }}
                                                    />
                                                </Grid>
                                            )}
                                        </Grid>

                                        {observacao && (
                                            <Typography variant="body2" sx={{
                                                mt: 2,
                                                color: theme.palette.grey[600],
                                                fontStyle: 'italic'
                                            }}>
                                                <strong>Observação:</strong> {observacao}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>
        );
    };

    // Rendering para detalhes da anamnese
    const renderAnamneseDetails = () => {
        if (noteType !== 'Anamnese' || !noteData) return null;

        return <AnamneseViewer anamneseData={noteData} typeColor={typeColor} onOpenPdf={handleOpenPdf} />;
    };

    const renderExameDetails = () => {
        if (noteType !== 'Exame' || !noteData) return null;

        return (
            <ExamViewer
                examData={noteData}
                typeColor={typeColor}
                onOpenFile={handleOpenAttachment}
            />
        );
    };

    // Rendering para informações de receita
    const renderReceitaDetails = () => {
        if (noteType !== 'Receita' || !noteData) return null;

        const tipoReceita = noteData.tipo ? noteData.tipo.charAt(0).toUpperCase() + noteData.tipo.slice(1) : 'Comum';
        const uso = noteData.uso ? noteData.uso.charAt(0).toUpperCase() + noteData.uso.slice(1) : 'Interno';

        return (
            <Box sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
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
                                {tipoReceita}
                            </Typography>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} sm={6}>
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
                                {uso}
                            </Typography>
                        </Paper>
                    </Grid>

                    {noteData.dataEmissao && (
                        <Grid item xs={12} sm={6}>
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
                                    {formatDate(noteData.dataEmissao)}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}

                    {noteData.dataValidade && (
                        <Grid item xs={12} sm={6}>
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
                                    {formatDate(noteData.dataValidade)}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}

                    {noteData.orientacaoGeral && (
                        <Grid item xs={12}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    backgroundColor: alpha(typeColor.light, 0.5),
                                    borderRadius: 2
                                }}
                            >
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    Orientações Gerais
                                </Typography>
                                <Typography variant="body1">
                                    {noteData.orientacaoGeral}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </Box>
        );
    };

    // Rendering para exibir a categoria da nota (para notas simples)
    const renderCategoryBanner = () => {
        if (noteType !== 'Rápida' && noteType !== 'Consulta') return null;
        if (!noteData.category) return null;

        return (
            <Box
                sx={{
                    mb: 3,
                    p: 2,
                    borderRadius: '12px',
                    backgroundColor: categoryColor.background,
                    border: `1px solid ${categoryColor.light}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                        sx={{
                            bgcolor: categoryColor.main,
                            color: 'white',
                            width: 40,
                            height: 40,
                            mr: 2,
                        }}
                    >
                        {categoryIcon}
                    </Avatar>
                    <Box>
                        <Typography sx={{ fontSize: '14px', color: categoryColor.dark, fontWeight: 600 }}>
                            CATEGORIA
                        </Typography>
                        <Typography sx={{ fontWeight: 600, color: categoryColor.dark, fontSize: '18px' }}>
                            {noteData.category}
                        </Typography>
                    </Box>
                </Box>
                <Chip
                    label={noteType === 'Consulta' ? 'Nota de Consulta' : 'Nota Rápida'}
                    size="small"
                    sx={{
                        bgcolor: 'white',
                        color: categoryColor.main,
                        fontWeight: 500,
                        border: `1px solid ${categoryColor.light}`,
                        '& .MuiChip-label': {
                            px: 1.5
                        }
                    }}
                />
            </Box>
        );
    };

    const renderReceitaContent = () => {
        if (noteType !== 'Receita') return null;

        return (
            <ReceitaViewer
                receitaData={noteData}
                typeColor={typeColor}
                onOpenPdf={handleOpenPdf}
            />
        );
    };

    // Rendering para anexos
    const renderAttachments = () => {
        if (!noteData.attachments || noteData.attachments.length === 0) return null;

        return (
            <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{
                    fontWeight: 600,
                    color: theme.palette.grey[800],
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2
                }}>
                    <AttachFileIcon sx={{ mr: 1 }} />
                    Anexos ({noteData.attachments.length})
                </Typography>

                <Grid container spacing={2}>
                    {noteData.attachments.map((attachment, index) => {
                        const fileInfo = getFileTypeInfo(attachment.fileName, attachment.fileType);

                        return (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        border: '1px solid #EAECEF',
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            backgroundColor: alpha(categoryColor.light, 0.3),
                                            borderColor: categoryColor.light,
                                        }
                                    }}
                                    onClick={() => handleOpenAttachment(attachment)}
                                >
                                    <Avatar
                                        sx={{
                                            bgcolor: alpha(fileInfo.color, 0.1),
                                            color: fileInfo.color,
                                            width: 40,
                                            height: 40,
                                            mr: 2
                                        }}
                                    >
                                        {fileInfo.icon}
                                    </Avatar>
                                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontWeight: 500,
                                                color: theme.palette.grey[800],
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {attachment.fileName}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{ color: theme.palette.grey[500] }}
                                        >
                                            {attachment.fileSize} • {attachment.uploadedAt ? formatDateTime(attachment.uploadedAt) : 'Data desconhecida'}
                                        </Typography>
                                    </Box>
                                    <Tooltip title="Abrir">
                                        <IconButton size="small">
                                            <LinkIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            </Box>
        );
    };

    if (!noteData) return null;

    // Determine o tema de cor com base no tipo e categoria
    const themeToUse = noteType === 'Rápida' || noteType === 'Consulta'
        ? categoryColor
        : typeColor;

    return (
        <ThemeProvider theme={theme}>
            <Dialog
                open={open}
                onClose={onClose}
                fullWidth
                maxWidth="md"
                fullScreen={fullScreen}
                TransitionComponent={Transition}
                PaperProps={{
                    sx: {
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0px 4px 30px rgba(0, 0, 0, 0.08)',
                        height: fullScreen ? '100%' : 'auto',
                        maxHeight: fullScreen ? '100%' : '90vh'
                    }
                }}
            >
                {/* Header Enhanced with Category when appropriate */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #EAECEF',
                        backgroundColor: themeToUse.light,
                        p: { xs: 2, sm: 3 }
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                            sx={{
                                bgcolor: themeToUse.main,
                                color: 'white',
                                width: 40,
                                height: 40,
                                mr: 2,
                                display: { xs: 'none', sm: 'flex' }
                            }}
                        >
                            {noteType === 'Rápida' || noteType === 'Consulta' ? categoryIcon : typeIcon}
                        </Avatar>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: themeToUse.dark }}>
                                    {noteData.noteTitle || noteData.titulo || `${typeLabel} - ${formatDate(noteData.createdAt)}`}
                                </Typography>
                                <Chip
                                    label={noteType === 'Rápida' || noteType === 'Consulta' ? noteData.category : typeLabel}
                                    size="small"
                                    sx={{
                                        ml: 1,
                                        bgcolor: themeToUse.main,
                                        color: 'white',
                                        fontWeight: 600,
                                        fontSize: '11px',
                                        height: '22px'
                                    }}
                                    icon={
                                        <Box component="span" sx={{ '& > svg': { color: 'white !important', fontSize: '14px !important' } }}>
                                            {noteType === 'Rápida' || noteType === 'Consulta' ? categoryIcon : typeIcon}
                                        </Box>
                                    }
                                />
                            </Box>
                            <Typography variant="body2" color="textSecondary">
                                Paciente: {getPatientName()}
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={onClose} sx={{ color: theme.palette.grey[700] }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Body */}
                <DialogContent sx={{ p: 0 }}>
                    <Box
                        sx={{
                            height: '100%',
                            p: { xs: 2, sm: 3 },
                            overflow: 'auto',
                            backgroundColor: themeToUse.background
                        }}
                    >
                        {/* Metadados e Datas */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: 2,
                                mb: 3,
                                p: 2,
                                borderRadius: 2,
                                backgroundColor: 'white',
                                border: '1px solid #EAECEF'
                            }}
                        >
                            {noteData.createdAt && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CalendarTodayIcon sx={{ color: theme.palette.grey[400], fontSize: 18, mr: 1 }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Criado em: {formatDateTime(noteData.createdAt)}
                                    </Typography>
                                </Box>
                            )}

                            {noteData.lastModified && (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <AccessTimeIcon sx={{ color: theme.palette.grey[400], fontSize: 18, mr: 1 }} />
                                    <Typography variant="body2" color="textSecondary">
                                        Atualizado: {formatTimeAgo(noteData.lastModified)}
                                    </Typography>
                                </Box>
                            )}

                            {noteData.consultationDate && (
                                <Box sx={{ display: 'flex', alignItems: 'center', ml: { xs: 0, sm: 'auto' } }}>
                                    <EventNoteIcon sx={{ color: themeToUse.main, fontSize: 18, mr: 1 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: themeToUse.main }}>
                                        Consulta: {formatDate(noteData.consultationDate)}
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Category Banner for simple notes */}
                        {renderCategoryBanner()}

                        {/* Conteúdo principal */}
                        {noteType !== 'Anamnese' && noteType !== 'Receita' && noteType !== 'Exame' && (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 2,
                                    border: '1px solid #EAECEF',
                                    mb: 3,
                                    backgroundColor: 'white'
                                }}
                            >
                                {/* Texto principal da nota */}
                                {noteData.noteText && (
                                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                                        {noteData.noteText}
                                    </Typography>
                                )}
                            </Paper>
                        )}

                        {/* Renderiza o ReceitaViewer para notas do tipo Receita */}
                        {noteType === 'Receita' && renderReceitaContent()}

                        {/* Mantém os detalhes específicos da anamnese */}
                        {noteType === 'Anamnese' && renderAnamneseDetails()}
                        {noteType === 'Exame' && renderExameDetails()}
                        {renderMedicamentos()}

                        {noteType !== 'Anamnese' && noteType !== 'Receita' && renderAttachments()}
                    </Box>
                </DialogContent>

                {/* Footer */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        p: { xs: 2, sm: 3 },
                        borderTop: '1px solid #EAECEF',
                        backgroundColor: 'white'
                    }}
                >
                    {deleteConfirm ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <WarningIcon sx={{ color: 'error.main', mr: 1.5 }} />
                            <Typography sx={{ color: 'error.main', fontWeight: 500, mr: 'auto' }}>
                                Tem certeza que deseja excluir esta nota?
                            </Typography>
                            <Button
                                variant="outlined"
                                onClick={handleDeleteCancel}
                                sx={{ mr: 1 }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={handleDeleteConfirm}
                            >
                                Excluir
                            </Button>
                        </Box>
                    ) : (
                        <>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteOutlineIcon />}
                                onClick={handleDeleteClick}
                                sx={{
                                    borderColor: theme.palette.error.main,
                                    color: theme.palette.error.main,
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.error.main, 0.04),
                                        borderColor: theme.palette.error.dark
                                    }
                                }}
                            >
                                Excluir
                            </Button>

                            <Box>
                                {(noteData.pdfUrl || noteType === 'Receita') && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<PictureAsPdfIcon />}
                                        onClick={handleOpenPdf}
                                        sx={{ mr: 2 }}
                                    >
                                        Ver PDF
                                    </Button>
                                )}

                                <Button
                                    variant="contained"
                                    startIcon={<EditIcon />}
                                    onClick={handleEdit}
                                    sx={{
                                        backgroundColor: themeToUse.main,
                                        color: 'white',
                                        '&:hover': {
                                            backgroundColor: themeToUse.dark
                                        }
                                    }}
                                >
                                    Editar
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
            </Dialog>
        </ThemeProvider>
    );
};

export default ViewNoteDialog;