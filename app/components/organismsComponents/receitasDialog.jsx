"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    Typography,
    Button,
    IconButton,
    TextField,
    Snackbar,
    Alert,
    Dialog,
    DialogContent,
    Slide,
    styled,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Chip,
    Paper,
    Card,
    CardContent,
    useMediaQuery,
    useTheme,
    InputAdornment,
    Tooltip,
    CircularProgress,
    Fade,
    Collapse,
    Autocomplete
} from "@mui/material";
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';

// Ícones
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MedicationIcon from "@mui/icons-material/Medication";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EventIcon from "@mui/icons-material/Event";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ListAltIcon from "@mui/icons-material/ListAlt";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import MedicalInformationIcon from "@mui/icons-material/MedicalInformation";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

import { format, addDays, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import FirebaseService from "../../../lib/firebaseService";
import { useAuth } from "../authProvider";

// Tema principal
const theme = createTheme({
    palette: {
        primary: {
            main: '#1852FE',
            light: '#ECF1FF',
        },
        secondary: {
            main: '#5E35B1',
            light: '#EDE7F6',
        },
        grey: {
            100: '#F6F7F9',
            200: '#EAECEF',
            400: '#94A3B8',
            500: '#64748B',
            800: '#344054',
        },
        success: {
            main: '#22C55E',
            light: '#DCFCE7',
        },
        error: {
            main: '#F04438',
            light: '#FEE4E2',
        },
        warning: {
            main: '#F59E0B',
            light: '#FEF3C7',
        },
        info: {
            main: '#3B82F6',
            light: '#DBEAFE',
        },
        common: {
            black: '#111828',
            white: '#FFFFFF',
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
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiInputBase-root': {
                        borderRadius: 8,
                    }
                }
            }
        }
    }
});

// Styled Dialog com transições suaves
const StyledDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        borderRadius: '16px',
        border: '1px solid #EAECEF',
        background: '#FFF',
        boxShadow: '0px 4px 40px 0px rgba(0, 0, 0, 0.1)',
        maxHeight: '90vh',
        margin: '16px',
        width: 'calc(100% - 32px)',
        maxWidth: '900px',
        overflow: 'hidden',
    },
    '& .MuiBackdrop-root': {
        backdropFilter: 'blur(4px)',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
}));

// Transição para o dialog
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

// Botões estilizados
const PrimaryButton = ({ children, loading, success, ...props }) => (
    <Button
        variant="contained"
        color="primary"
        sx={{
            height: 44,
            px: 3,
            fontWeight: 600,
            fontSize: '15px',
            boxShadow: 'none',
            '&:hover': { boxShadow: '0 4px 8px rgba(24, 82, 254, 0.2)' },
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.2s ease',
        }}
        {...props}
    >
        {loading ? (
            <CircularProgress size={20} color="inherit" />
        ) : success ? (
            <Fade in={success}>
                <CheckCircleOutlineIcon />
            </Fade>
        ) : (
            children
        )}
    </Button>
);

const SecondaryButton = ({ children, ...props }) => (
    <Button
        variant="outlined"
        sx={{
            height: 44,
            px: 3,
            fontWeight: 600,
            fontSize: '15px',
            borderColor: '#D0D5DD',
            color: theme.palette.grey[800],
            '&:hover': {
                borderColor: '#B0B7C3',
                backgroundColor: 'rgba(52, 64, 84, 0.04)'
            }
        }}
        {...props}
    >
        {children}
    </Button>
);

// Card para medicamentos
const MedicationCard = styled(Card)(({ theme }) => ({
    borderRadius: 12,
    border: '1px solid #EAECEF',
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
    marginBottom: 16,
    transition: 'all 0.2s ease',
    '&:hover': {
        boxShadow: '0px 3px 8px rgba(0, 0, 0, 0.08)',
        borderColor: '#D0D5DD',
    }
}));

// Formulário principal
const ReceitaDialog = ({ open, onClose, patientId, doctorId, onSave, receitaId = null }) => {
    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const { user } = useAuth();
    const isEditMode = !!receitaId;

    // Estados
    const [loading, setLoading] = useState(true);
    const [patientData, setPatientData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
    const [error, setError] = useState(null);
    const [expandedSection, setExpandedSection] = useState("medicamentos");
    const [addingMedicamento, setAddingMedicamento] = useState(false);
    const [editingMedicamentoIndex, setEditingMedicamentoIndex] = useState(null);
    const [medications, setMedications] = useState([]);
    const [loadingMedications, setLoadingMedications] = useState(false);
    const [patients, setPatients] = useState([]);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showPatientSelector, setShowPatientSelector] = useState(false);

    // Referência para o campo de orientação geral para focar quando necessário
    const orientacaoGeralRef = useRef(null);

    useEffect(() => {
        const fetchMedications = async () => {
            if (!open || !doctorId) return;

            try {
                setLoadingMedications(true);
                const medicationsData = await FirebaseService.listMedications(doctorId);
                setMedications(medicationsData);
            } catch (error) {
                console.error("Erro ao carregar medicamentos:", error);
            } finally {
                setLoadingMedications(false);
            }
        };

        fetchMedications();
    }, [open, doctorId]);

    // Dados da receita
    const [receitaData, setReceitaData] = useState({
        patientId: patientId,
        doctorId: doctorId,
        tipo: "comum", // comum, controlada, especial
        titulo: "",
        dataEmissao: new Date(),
        dataValidade: addMonths(new Date(), 6), // Padrão: validade de 6 meses
        orientacaoGeral: "",
        medicamentos: [],
    });

    // Estado temporário para o medicamento sendo adicionado/editado
    const [medicamentoTemp, setMedicamentoTemp] = useState({
        nome: "",
        concentracao: "",
        posologia: "",
        duracao: "",
        quantidade: "",
        observacao: ""
    });

    // Estado para feedback (Snackbar)
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success"
    });

    // Carregar lista de pacientes se não tivermos um patientId
    useEffect(() => {
        if (open && !patientId && doctorId) {
            setShowPatientSelector(true);
            fetchPatients();
        } else {
            setShowPatientSelector(false);
        }
    }, [open, patientId, doctorId]);

    // Função para buscar pacientes
    const fetchPatients = async () => {
        try {
            setLoadingPatients(true);
            const patientsData = await FirebaseService.listPatients(doctorId);
            setPatients(patientsData);
        } catch (error) {
            console.error("Erro ao buscar pacientes:", error);
            setSnackbar({
                open: true,
                message: "Erro ao carregar lista de pacientes.",
                severity: "error"
            });
        } finally {
            setLoadingPatients(false);
        }
    };

    // Filtrar pacientes com base na pesquisa
    const filteredPatients = patients.filter(patient => {
        const name = patient.nome || patient.patientName || '';
        return name.toLowerCase().includes(patientSearch.toLowerCase());
    });

    useEffect(() => {
        if (!open) {
            setIsSubmitting(false);
            setIsSaved(false);
            setLoading(true); // se necessário, para reiniciar o processo de carregamento
            // opcionalmente, reset outras variáveis de estado
        }
    }, [open]);

    // Efeito para carregar dados do paciente quando o componente for montado
    useEffect(() => {
        if (open) {
            // Se temos patientId ou se selecionamos um paciente
            const currentPatientId = patientId || selectedPatient?.id;

            if (currentPatientId && doctorId) {
                fetchPatientData(currentPatientId);

                // Se estiver no modo de edição, carrega os dados da receita
                if (isEditMode && receitaId) {
                    loadReceitaData();
                } else {
                    // Caso contrário, inicializa uma nova receita
                    setReceitaData(prev => ({
                        ...prev,
                        patientId: currentPatientId,
                        doctorId: doctorId,
                        tipo: "comum",
                        titulo: "",
                        dataEmissao: new Date(),
                        dataValidade: addMonths(new Date(), 6),
                        orientacaoGeral: "",
                        medicamentos: []
                    }));
                    setLoading(false);
                }
            } else if (!patientId && !selectedPatient) {
                // Se não temos patientId e não selecionamos um paciente, apenas indicamos que não estamos carregando
                setLoading(false);
            }
        }
    }, [open, patientId, receitaId, isEditMode, selectedPatient]);

    // Função para buscar dados da receita (no modo de edição)
    const loadReceitaData = async () => {
        try {
            const receita = await FirebaseService.getPrescription(doctorId, patientId || selectedPatient?.id, receitaId);

            if (receita) {
                // Convertendo as datas de Timestamp para Date se necessário
                const dataEmissao = receita.dataEmissao?.toDate ?
                    receita.dataEmissao.toDate() : new Date(receita.dataEmissao);

                const dataValidade = receita.dataValidade?.toDate ?
                    receita.dataValidade.toDate() : new Date(receita.dataValidade);

                setReceitaData({
                    ...receita,
                    dataEmissao,
                    dataValidade
                });
            } else {
                setError("Receita não encontrada.");
            }
        } catch (err) {
            console.error("Erro ao carregar dados da receita:", err);
            setError("Erro ao carregar dados da receita.");
        } finally {
            setLoading(false);
        }
    };

    // Função para buscar dados do paciente no Firebase
    const fetchPatientData = async (patId) => {
        try {
            const patientDoc = await FirebaseService.getPatient(doctorId, patId);

            if (patientDoc) {
                setPatientData(patientDoc);

                // Pré-preenche o título da receita com o nome do paciente
                const patientName = patientDoc.nome || patientDoc.patientName;
                if (patientName && !receitaId) {
                    setReceitaData(prev => ({
                        ...prev,
                        patientId: patId,
                        titulo: `Receita para ${patientName}`
                    }));
                }
            } else {
                setError("Paciente não encontrado.");
            }
        } catch (err) {
            console.error("Erro ao buscar dados do paciente:", err);
            setError("Erro ao carregar dados do paciente.");
        }
    };

    // Funções para gerenciar os dados da receita
    const handleChangeTipoReceita = (e) => {
        const tipo = e.target.value;
        let novaValidade;

        // Ajusta a validade com base no tipo de receita
        if (tipo === "controlada" || tipo === "antimicrobiano") {
            novaValidade = addDays(new Date(), 30); // 30 dias para controladas e antimicrobianos
        } else if (tipo === "especial") {
            novaValidade = addDays(new Date(), 60); // 60 dias para especiais
        } else {
            novaValidade = addMonths(new Date(), 6); // 6 meses para comuns
        }

        setReceitaData({
            ...receitaData,
            tipo,
            dataValidade: novaValidade
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setReceitaData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        if (value) {
            const date = new Date(value);
            setReceitaData(prev => ({
                ...prev,
                [name]: date
            }));
        }
    };

    // Funções para gerenciar medicamentos
    const handleMedicamentoTempChange = (e) => {
        const { name, value } = e.target;
        setMedicamentoTemp(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateMedicamento = () => {
        return medicamentoTemp.nome.trim() !== "" &&
            (medicamentoTemp.posologia.trim() !== "" ||
                medicamentoTemp.observacao?.trim() !== "");
    };

    const handleAddMedicamento = () => {
        if (!validateMedicamento()) {
            setSnackbar({
                open: true,
                message: "Nome do medicamento e posologia são obrigatórios.",
                severity: "error"
            });
            return;
        }

        if (editingMedicamentoIndex !== null) {
            // Editando um medicamento existente
            const novosMedicamentos = [...receitaData.medicamentos];
            novosMedicamentos[editingMedicamentoIndex] = {...medicamentoTemp};
            setReceitaData(prev => ({
                ...prev,
                medicamentos: novosMedicamentos
            }));
            setEditingMedicamentoIndex(null);
        } else {
            // Adicionando um novo medicamento
            setReceitaData(prev => ({
                ...prev,
                medicamentos: [...prev.medicamentos, {...medicamentoTemp}]
            }));
        }

        // Limpa o formulário temporário
        setMedicamentoTemp({
            nome: "",
            concentracao: "",
            posologia: "",
            duracao: "",
            quantidade: "",
            observacao: ""
        });
        setAddingMedicamento(false);
    };

    const handleEditMedicamento = (index) => {
        setMedicamentoTemp({...receitaData.medicamentos[index]});
        setEditingMedicamentoIndex(index);
        setAddingMedicamento(true);
    };

    const handleDeleteMedicamento = (index) => {
        const novosMedicamentos = [...receitaData.medicamentos];
        novosMedicamentos.splice(index, 1);
        setReceitaData(prev => ({
            ...prev,
            medicamentos: novosMedicamentos
        }));
    };

    const handleCancelMedicamento = () => {
        setMedicamentoTemp({
            nome: "",
            concentracao: "",
            posologia: "",
            duracao: "",
            quantidade: "",
            observacao: ""
        });
        setAddingMedicamento(false);
        setEditingMedicamentoIndex(null);
    };

    const toggleSection = (section) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    // Funções para formatar datas
    const formatDate = (date) => {
        if (!date) return "";
        return format(date instanceof Date ? date : new Date(date), "dd/MM/yyyy", { locale: ptBR });
    };

    const formatDateForInput = (date) => {
        if (!date) return "";
        return format(date instanceof Date ? date : new Date(date), "yyyy-MM-dd");
    };

    // Validação do formulário
    const validateForm = () => {
        if (!receitaData.titulo.trim()) {
            setSnackbar({
                open: true,
                message: "Por favor, informe um título para a receita.",
                severity: "error"
            });
            return false;
        }

        if (!receitaData.patientId && !selectedPatient) {
            setSnackbar({
                open: true,
                message: "Por favor, selecione um paciente.",
                severity: "error"
            });
            return false;
        }

        return true;
    };

    // Função para gerar PDF da receita
    const generateReceitaPDF = () => {
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
        const tipoText = receitaData.tipo === "comum" ? "RECEITA MÉDICA" :
            receitaData.tipo === "controlada" ? "RECEITA CONTROLADA" :
                receitaData.tipo === "especial" ? "RECEITA ESPECIAL" :
                    "RECEITA DE ANTIMICROBIANO";

        doc.text(tipoText, pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        // Dados do médico
        const doctorName = user?.displayName || "Dr(a).";
        const doctorCRM = user?.crm || "CRM:";
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${doctorName}`, margin, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        doc.text(`${doctorCRM}`, margin, yPos);
        yPos += 10;

        // Linha separadora
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 15;

        // Dados do paciente e da receita
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Paciente: ${getPatientName()}`, margin, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');

        // Data de emissão e validade
        doc.text(`Data: ${formatDate(receitaData.dataEmissao)}`, margin, yPos);
        const validadeText = `Válida até: ${formatDate(receitaData.dataValidade)}`;
        doc.text(validadeText, pageWidth - margin - doc.getTextWidth(validadeText), yPos);
        yPos += 7;

        // Medicamentos
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("PRESCRIÇÃO:", margin, yPos);
        yPos += 10;

        // Lista de medicamentos
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');

        receitaData.medicamentos.forEach((med, index) => {
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFont('helvetica', 'bold');
            doc.text(`${index + 1}. ${med.nome}${med.concentracao ? ` ${med.concentracao}` : ''}`, margin, yPos);
            yPos += 7;

            doc.setFont('helvetica', 'normal');
            if (med.posologia) {
                yPos = addWrappedText(`Posologia: ${med.posologia}`, margin + 5, yPos, pageWidth - (2 * margin) - 5) + 5;
            }

            if (med.quantidade) {
                yPos = addWrappedText(`Quantidade: ${med.quantidade}`, margin + 5, yPos, pageWidth - (2 * margin) - 5) + 5;
            }

            if (med.duracao) {
                yPos = addWrappedText(`Duração: ${med.duracao}`, margin + 5, yPos, pageWidth - (2 * margin) - 5) + 5;
            }

            yPos += 5;
        });

        // Orientação geral e observações
        if (receitaData.orientacaoGeral) {
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
            yPos = addWrappedText(receitaData.orientacaoGeral, margin, yPos, pageWidth - (2 * margin)) + 10;
        }

        // Assinatura
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = 40;
        } else {
            yPos = pageHeight - 50;
        }

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
        }

        return doc;
    };

    // Função para salvar a receita
    const handleSaveReceita = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            // Gere o PDF
            const pdfDoc = generateReceitaPDF();
            const pdfBlob = pdfDoc.output('blob');

            // Normaliza os dados da receita
            let receitaId;
            const currentPatientId = patientId || selectedPatient?.id;

            const normalizedData = {
                ...receitaData,
                patientId: currentPatientId,
                medications: receitaData.medicamentos.map(med => ({
                    medicationName: med.nome,
                    dosage: med.concentracao,
                    frequency: med.posologia,
                    duration: med.duracao,
                    quantity: med.quantidade,
                    observation: med.observacao
                })),
                updatedAt: new Date()
            };

            // Se estivermos editando, atualiza a receita existente; caso contrário, cria uma nova
            if (isEditMode) {
                await FirebaseService.updatePrescription(doctorId, currentPatientId, receitaData.id, normalizedData);
                receitaId = receitaData.id;
            } else {
                normalizedData.createdAt = new Date();
                receitaId = await FirebaseService.createPrescription(doctorId, currentPatientId, normalizedData);
            }

            // Salvar o PDF no Firebase Storage
            const pdfFileName = `receitas/${doctorId}/${currentPatientId}/${receitaId}.pdf`;
            const pdfUrl = await FirebaseService.uploadFile(pdfBlob, pdfFileName);

            // Atualize a receita com o URL do PDF
            await FirebaseService.updatePrescription(doctorId, currentPatientId, receitaId, {
                pdfUrl: pdfUrl
            });

            // Cria uma nota associada à receita
            const medicamentosText = receitaData.medicamentos.map(med =>
                `- ${med.nome}${med.concentracao ? ` ${med.concentracao}` : ''}: ${med.posologia}`
            ).join('\n');

            const formattedDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
            const noteData = {
                noteTitle: receitaData.titulo || `Receita - ${getPatientName()}`,
                noteText: `Receita ${receitaData.tipo === "controlada" ? "Controlada" :
                    receitaData.tipo === "especial" ? "Especial" :
                        receitaData.tipo === "antimicrobiano" ? "de Antimicrobiano" : "Comum"} emitida em ${formattedDate}.\n\nMedicamentos:\n${medicamentosText}`,
                noteType: "Receita", // Tipo especial para receitas
                consultationDate: receitaData.dataEmissao,
                prescriptionId: receitaId, // Referência para a receita
                pdfUrl: pdfUrl // Adicione a URL do PDF à nota
            };

            await FirebaseService.createNote(doctorId, currentPatientId, noteData);

            setSnackbar({
                open: true,
                message: isEditMode ? "Receita atualizada com sucesso!" : "Receita criada com sucesso!",
                severity: "success"
            });
            setIsSaved(true);

            // Fecha o diálogo após um curto delay
            setTimeout(() => {
                if (onSave) {
                    onSave(receitaId);
                }
                onClose();
            }, 1500);

        } catch (error) {
            console.error("Erro ao salvar receita:", error);
            setSnackbar({
                open: true,
                message: "Erro ao salvar receita. Tente novamente.",
                severity: "error"
            });
            setIsSubmitting(false);
        }
    };

    // Função para confirmar a exclusão da receita
    const handleConfirmDelete = () => {
        setIsDeleteConfirm(true);
    };

    // Função para deletar a receita
    const handleDeleteReceita = async () => {
        if (!isEditMode || !receitaData.id) return;

        setIsSubmitting(true);
        try {
            await FirebaseService.deletePrescription(
                doctorId,
                patientId || selectedPatient?.id,
                receitaData.id
            );

            setSnackbar({
                open: true,
                message: "Receita excluída com sucesso!",
                severity: "success"
            });

            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            console.error("Erro ao excluir receita:", error);
            setSnackbar({
                open: true,
                message: "Erro ao excluir receita. Tente novamente.",
                severity: "error"
            });
            setIsSubmitting(false);
        }
    };

    // Função para fechar snackbar
    const handleCloseSnackbar = () => {
        setSnackbar({
            ...snackbar,
            open: false
        });
    };

    // Obter nome do paciente
    const getPatientName = () => {
        if (selectedPatient) {
            return selectedPatient.nome || selectedPatient.patientName || 'Paciente';
        }
        return patientData?.nome || patientData?.patientName || 'Paciente';
    };

    // Handler para selecionar paciente
    const handleSelectPatient = (patient) => {
        setSelectedPatient(patient);
        setShowPatientSelector(false);
        fetchPatientData(patient.id);
    };

    // Renderização condicional para estado de carregamento
    if (loading && open && !showPatientSelector) {
        return (
            <ThemeProvider theme={theme}>
                <StyledDialog
                    open={open}
                    onClose={() => onClose()}
                    TransitionComponent={Transition}
                    fullScreen={fullScreen}
                    maxWidth="md"
                >
                    <Box sx={{
                        p: 2.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #EAECEF',
                    }}>
                        <Typography variant="h6">Carregando Receita</Typography>
                        <IconButton onClick={() => onClose()}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '50vh',
                        flexDirection: 'column'
                    }}>
                        <CircularProgress size={60} sx={{ mb: 2 }} />
                        <Typography>Carregando dados...</Typography>
                    </Box>
                </StyledDialog>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <StyledDialog
                open={open}
                onClose={isSubmitting ? null : onClose}
                TransitionComponent={Transition}
                fullScreen={fullScreen}
                maxWidth="md"
            >
                {/* Header */}
                <Box sx={{
                    p: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #EAECEF',
                }}>
                    <IconButton
                        onClick={onClose}
                        disabled={isSubmitting}
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: '#F6F7F9',
                            color: '#64748B',
                            '&:hover': {
                                backgroundColor: '#EAECEF',
                                color: '#475467'
                            }
                        }}
                    >
                        <ArrowBackIcon />
                    </IconButton>

                    {isEditMode && !isDeleteConfirm ? (
                        <Button
                            variant="text"
                            color="error"
                            startIcon={<DeleteOutlineIcon />}
                            onClick={handleConfirmDelete}
                            disabled={isSubmitting}
                            sx={{
                                color: '#F04438',
                                textTransform: 'none',
                                fontSize: '14px',
                                fontWeight: 500,
                                '&:hover': {
                                    backgroundColor: 'rgba(240, 68, 56, 0.08)',
                                }
                            }}
                        >
                            Excluir receita
                        </Button>
                    ) : isEditMode && isDeleteConfirm ? (
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            <Typography sx={{ color: 'error.main', fontWeight: 500 }}>
                                Confirmar exclusão?
                            </Typography>
                            <Button
                                variant="outlined"
                                color="inherit"
                                onClick={() => setIsDeleteConfirm(false)}
                                disabled={isSubmitting}
                                sx={{
                                    height: 36,
                                    borderRadius: 18,
                                    borderColor: '#D0D5DD',
                                    color: '#475467',
                                    px: 2,
                                    '&:hover': {
                                        borderColor: '#B0B7C3',
                                    }
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                onClick={handleDeleteReceita}
                                disabled={isSubmitting}
                                sx={{
                                    height: 36,
                                    borderRadius: 18,
                                    px: 2,
                                    boxShadow: 'none',
                                }}
                            >
                                Confirmar
                            </Button>
                        </Box>
                    ) : null}
                </Box>

                {/* Conteúdo do Dialog */}
                <DialogContent sx={{
                    p: 0,
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#B0B0B0 #E0E0E0',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: theme.palette.grey[100],
                        borderRadius: '8px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: theme.palette.primary.main,
                        borderRadius: '8px',
                        border: `2px solid ${theme.palette.grey[100]}`,
                    },
                }}>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        overflow: 'hidden',
                    }}>
                        {/* Conteúdo Principal */}
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            px: { xs: 2.5, sm: 4 },
                            pt: 4,
                            pb: 3,
                            width: '100%',
                            maxWidth: '900px',
                            mx: 'auto',
                        }}>
                            {/* Ícone e Título */}
                            <Box sx={{ textAlign: 'center', mb: 4 }}>
                                <Box
                                    component="img"
                                    src="/receitaicon.svg"
                                    alt="Receita"
                                    sx={{
                                        width: 48,
                                        height: 48,
                                        mb: 2
                                    }}
                                />
                                <Typography
                                    variant="h4"
                                    sx={{
                                        fontSize: '28px',
                                        fontWeight: 600,
                                        color: '#101828'
                                    }}
                                >
                                    {isEditMode ? 'Editar receita' : 'Nova receita'}
                                </Typography>
                                {(patientData || selectedPatient) && (
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: '#64748B',
                                            mt: 1
                                        }}
                                    >
                                        Paciente: {getPatientName()}
                                    </Typography>
                                )}
                            </Box>

                            {/* Seletor de Paciente (apenas se não tivermos um paciente selecionado) */}
                            {showPatientSelector && (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        width: '100%',
                                        border: '1px solid #EAECEF',
                                        borderRadius: '16px',
                                        p: 3,
                                        mb: 3,
                                        bgcolor: '#FAFBFC',
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            mb: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontWeight: 600
                                        }}
                                    >
                                        <PersonIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                                        Selecione um Paciente
                                    </Typography>

                                    <TextField
                                        fullWidth
                                        placeholder="Buscar paciente por nome..."
                                        value={patientSearch}
                                        onChange={(e) => setPatientSearch(e.target.value)}
                                        sx={{ mb: 2 }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    {loadingPatients ? (
                                        <Box sx={{ textAlign: 'center', py: 3 }}>
                                            <CircularProgress size={40} />
                                        </Box>
                                    ) : (
                                        <>
                                            {filteredPatients.length > 0 ? (
                                                <Box sx={{ maxHeight: '300px', overflow: 'auto', p: 1 }}>
                                                    {filteredPatients.map((patient) => (
                                                        <Card
                                                            key={patient.id}
                                                            sx={{
                                                                mb: 1.5,
                                                                border: '1px solid #EAECEF',
                                                                borderRadius: '12px',
                                                                boxShadow: 'none',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s',
                                                                '&:hover': {
                                                                    borderColor: theme.palette.primary.main,
                                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                                                                }
                                                            }}
                                                            onClick={() => handleSelectPatient(patient)}
                                                        >
                                                            <CardContent sx={{ p: 2 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                                    <Box
                                                                        sx={{
                                                                            width: 40,
                                                                            height: 40,
                                                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                                            borderRadius: '50%',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            mr: 2
                                                                        }}
                                                                    >
                                                                        <PersonIcon sx={{ color: theme.palette.primary.main }} />
                                                                    </Box>
                                                                    <Box>
                                                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                                            {patient.nome || patient.patientName || 'Sem nome'}
                                                                        </Typography>
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            {patient.email || patient.telefone || patient.phone || 'Sem contato'}
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                            </CardContent>
                                                        </Card>
                                                    ))}
                                                </Box>
                                            ) : (
                                                <Box sx={{ textAlign: 'center', py: 3, bgcolor: '#F9FAFB', borderRadius: 2 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Nenhum paciente encontrado
                                                    </Typography>
                                                </Box>
                                            )}
                                        </>
                                    )}
                                </Paper>
                            )}

                            {/* Formulário da Receita (apenas se um paciente estiver selecionado) */}
                            {(patientId || selectedPatient) && (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        width: '100%',
                                        border: '1px solid #EAECEF',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        overflow: 'hidden',
                                        boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
                                        minHeight: '420px',
                                        position: 'relative',
                                        mb: 3
                                    }}
                                >
                                    {/* Seção de Informações Básicas */}
                                    <Box sx={{ p: 3, borderBottom: '1px solid #EAECEF' }}>
                                        <Grid container spacing={3}>
                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    label="Título da Receita"
                                                    placeholder="Ex: Receita para tratamento de hipertensão"
                                                    name="titulo"
                                                    value={receitaData.titulo}
                                                    onChange={handleChange}
                                                    disabled={isSubmitting}
                                                    required
                                                    InputLabelProps={{
                                                        shrink: true,
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={4}>
                                                <FormControl fullWidth>
                                                    <InputLabel id="tipo-receita-label">Tipo de Receita</InputLabel>
                                                    <Select
                                                        labelId="tipo-receita-label"
                                                        id="tipo-receita"
                                                        value={receitaData.tipo}
                                                        label="Tipo de Receita"
                                                        onChange={handleChangeTipoReceita}
                                                        disabled={isSubmitting}
                                                    >
                                                        <MenuItem value="comum">Comum</MenuItem>
                                                        <MenuItem value="controlada">Controlada</MenuItem>
                                                        <MenuItem value="especial">Especial</MenuItem>
                                                        <MenuItem value="antimicrobiano">Antimicrobiano</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={4}>
                                                <TextField
                                                    fullWidth
                                                    label="Data de Emissão"
                                                    type="date"
                                                    name="dataEmissao"
                                                    value={formatDateForInput(receitaData.dataEmissao)}
                                                    onChange={handleDateChange}
                                                    disabled={isSubmitting}
                                                    InputLabelProps={{
                                                        shrink: true,
                                                    }}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <CalendarTodayIcon fontSize="small" color="action" />
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    label="Data de Validade"
                                                    type="date"
                                                    name="dataValidade"
                                                    value={formatDateForInput(receitaData.dataValidade)}
                                                    onChange={handleDateChange}
                                                    disabled={isSubmitting}
                                                    InputLabelProps={{
                                                        shrink: true,
                                                    }}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <EventIcon fontSize="small" color="action" />
                                                            </InputAdornment>
                                                        ),
                                                    }}
                                                />
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                                                    {receitaData.tipo === "controlada" || receitaData.tipo === "antimicrobiano"
                                                        ? "Validade: 30 dias"
                                                        : receitaData.tipo === "especial"
                                                            ? "Validade: 60 dias"
                                                            : "Validade: 6 meses"}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Box>

                                    {/* Seção de Orientações Gerais */}
                                    <Box sx={{ p: 3, flexGrow: 1, borderBottom: '1px solid #EAECEF' }}>
                                        <Typography
                                            variant="subtitle1"
                                            sx={{ mb: 2, display: 'flex', alignItems: 'center', fontWeight: 600 }}
                                        >
                                            <MedicalInformationIcon sx={{ mr: 1, fontSize: 20, color: theme.palette.primary.main }} />
                                            Orientações Gerais
                                        </Typography>
                                        <TextField
                                            fullWidth
                                            placeholder="Orientações gerais para o paciente, instruções de uso, cuidados especiais..."
                                            multiline
                                            rows={6}
                                            name="orientacaoGeral"
                                            value={receitaData.orientacaoGeral}
                                            onChange={handleChange}
                                            disabled={isSubmitting}
                                            inputRef={orientacaoGeralRef}
                                            variant="outlined"
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '12px',
                                                    backgroundColor: '#FAFBFC',
                                                }
                                            }}
                                            InputProps={{
                                                sx: {
                                                    fontSize: '15px',
                                                    lineHeight: 1.6,
                                                }
                                            }}
                                        />
                                    </Box>

                                    {/* Seção de Medicamentos */}
                                    <Box sx={{ p: 0 }}>
                                        <Box
                                            sx={{
                                                p: 3,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                borderBottom: expandedSection === "medicamentos" ? '1px solid #EAECEF' : 'none',
                                                bgcolor: theme.palette.grey[100],
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => toggleSection("medicamentos")}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <MedicationIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                    Medicamentos
                                                </Typography>
                                                <Chip
                                                    label={receitaData.medicamentos.length}
                                                    size="small"
                                                    sx={{
                                                        ml: 1,
                                                        bgcolor: theme.palette.primary.light,
                                                        color: theme.palette.primary.main,
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </Box>
                                            <IconButton size="small">
                                                {expandedSection === "medicamentos" ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                            </IconButton>
                                        </Box>

                                        <Collapse in={expandedSection === "medicamentos"}>
                                            <Box sx={{ p: 3 }}>
                                                {/* Lista de medicamentos adicionados */}
                                                {receitaData.medicamentos.length > 0 ? (
                                                    <Box sx={{ mb: 3 }}>
                                                        {receitaData.medicamentos.map((med, index) => (
                                                            <MedicationCard key={index}>
                                                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                        <Box>
                                                                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                                                {med.nome}
                                                                                {med.concentracao && (
                                                                                    <Typography component="span" sx={{ fontWeight: 500, ml: 1 }}>
                                                                                        {med.concentracao}
                                                                                    </Typography>
                                                                                )}
                                                                            </Typography>

                                                                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 1 }}>
                                                                                {med.posologia}
                                                                            </Typography>

                                                                            <Grid container spacing={2} sx={{ mt: 0.5 }}>
                                                                                {med.quantidade && (
                                                                                    <Grid item>
                                                                                        <Chip
                                                                                            label={`Quantidade: ${med.quantidade}`}
                                                                                            size="small"
                                                                                            sx={{ bgcolor: theme.palette.grey[100] }}
                                                                                        />
                                                                                    </Grid>
                                                                                )}

                                                                                {med.duracao && (
                                                                                    <Grid item>
                                                                                        <Chip
                                                                                            label={`Duração: ${med.duracao}`}
                                                                                            size="small"
                                                                                            sx={{ bgcolor: theme.palette.grey[100] }}
                                                                                        />
                                                                                    </Grid>
                                                                                )}
                                                                            </Grid>

                                                                            {med.observacao && (
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    sx={{
                                                                                        mt: 1.5,
                                                                                        color: theme.palette.text.secondary,
                                                                                        fontSize: '13px',
                                                                                        fontStyle: 'italic'
                                                                                    }}
                                                                                >
                                                                                    Obs: {med.observacao}
                                                                                </Typography>
                                                                            )}
                                                                        </Box>

                                                                        <Box sx={{ display: 'flex' }}>
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={() => handleEditMedicamento(index)}
                                                                                disabled={isSubmitting || addingMedicamento}
                                                                            >
                                                                                <EditIcon fontSize="small" />
                                                                            </IconButton>
                                                                            <IconButton
                                                                                size="small"
                                                                                color="error"
                                                                                onClick={() => handleDeleteMedicamento(index)}
                                                                                disabled={isSubmitting || addingMedicamento}
                                                                            >
                                                                                <DeleteIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Box>
                                                                    </Box>
                                                                </CardContent>
                                                            </MedicationCard>
                                                        ))}
                                                    </Box>
                                                ) : (
                                                    <Box
                                                        sx={{
                                                            textAlign: 'center',
                                                            py: 3,
                                                            border: '1px dashed #CCD3DF',
                                                            borderRadius: 2,
                                                            bgcolor: theme.palette.grey[50],
                                                            mb: 3
                                                        }}
                                                    >
                                                        <LocalPharmacyIcon sx={{ fontSize: 40, color: '#94A3B8', mb: 1 }} />
                                                        <Typography sx={{ color: theme.palette.text.secondary }}>
                                                            Nenhum medicamento adicionado
                                                        </Typography>
                                                    </Box>
                                                )}

                                                {!addingMedicamento ? (
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<AddCircleOutlineIcon />}
                                                        onClick={() => setAddingMedicamento(true)}
                                                        disabled={isSubmitting}
                                                        fullWidth
                                                        sx={{
                                                            borderRadius: '10px',
                                                            p: 1.5,
                                                            borderStyle: 'dashed'
                                                        }}
                                                    >
                                                        Adicionar Medicamento
                                                    </Button>
                                                ) : (
                                                    <Paper sx={{ p: 2, border: '1px solid #EAECEF', borderRadius: '12px' }}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                                                            {editingMedicamentoIndex !== null ? "Editar Medicamento" : "Novo Medicamento"}
                                                        </Typography>

                                                        <Grid container spacing={2}>
                                                            <Grid item xs={12} sm={6}>
                                                                <Autocomplete
                                                                    id="medication-name"
                                                                    freeSolo
                                                                    loading={loadingMedications}
                                                                    options={medications.map(med => med.name)}
                                                                    value={medicamentoTemp.nome}
                                                                    size="small"
                                                                    onChange={(event, newValue) => {
                                                                        // Preenche automaticamente outros campos quando um medicamento existente é selecionado
                                                                        if (newValue) {
                                                                            const selectedMed = medications.find(m => m.name === newValue);
                                                                            if (selectedMed) {
                                                                                setMedicamentoTemp({
                                                                                    ...medicamentoTemp,
                                                                                    nome: selectedMed.name,
                                                                                    // Adiciona a primeira dosagem disponível, se houver
                                                                                    concentracao: selectedMed.dosages && selectedMed.dosages.length > 0 ?
                                                                                        selectedMed.dosages[0] : medicamentoTemp.concentracao,
                                                                                    // Adiciona instruções padrão do medicamento, se disponíveis
                                                                                    observacao: selectedMed.instructions || medicamentoTemp.observacao
                                                                                });
                                                                            } else {
                                                                                // Se for um novo medicamento digitado manualmente
                                                                                setMedicamentoTemp({
                                                                                    ...medicamentoTemp,
                                                                                    nome: newValue
                                                                                });
                                                                            }
                                                                        }
                                                                    }}
                                                                    onInputChange={(event, newInputValue) => {
                                                                        setMedicamentoTemp({
                                                                            ...medicamentoTemp,
                                                                            nome: newInputValue
                                                                        });
                                                                    }}
                                                                    renderInput={(params) => (
                                                                        <TextField
                                                                            {...params}
                                                                            label="Nome do Medicamento"
                                                                            placeholder="Ex: Dipirona"
                                                                            required
                                                                            fullWidth
                                                                            InputProps={{
                                                                                ...params.InputProps,
                                                                                endAdornment: (
                                                                                    <>
                                                                                        {loadingMedications ? <CircularProgress color="inherit" size={20} /> : null}
                                                                                        {params.InputProps.endAdornment}
                                                                                    </>
                                                                                ),
                                                                            }}
                                                                        />
                                                                    )}
                                                                    renderOption={(props, option) => {
                                                                        const medication = medications.find(med => med.name === option);
                                                                        return (
                                                                            <li {...props}>
                                                                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                                                    <Typography variant="body1">{option}</Typography>
                                                                                    {medication?.form && (
                                                                                        <Typography variant="caption" color="text.secondary">
                                                                                            {medication.form}
                                                                                            {medication.dosages && medication.dosages.length > 0 &&
                                                                                                ` - ${medication.dosages.join(', ')}`}
                                                                                        </Typography>
                                                                                    )}
                                                                                </Box>
                                                                            </li>
                                                                        );
                                                                    }}
                                                                />
                                                            </Grid>
                                                            <Grid item xs={12} sm={6}>
                                                                {/* Campo de concentração - Se o medicamento existir, mostrar select de dosagens */}
                                                                {medicamentoTemp.nome && medications.some(m => m.name === medicamentoTemp.nome) &&
                                                                medications.find(m => m.name === medicamentoTemp.nome)?.dosages?.length > 0 ? (
                                                                    <FormControl fullWidth size="small">
                                                                        <InputLabel id="dosage-select-label">Concentração</InputLabel>
                                                                        <Select
                                                                            labelId="dosage-select-label"
                                                                            value={medicamentoTemp.concentracao || ''}
                                                                            onChange={(e) => setMedicamentoTemp({
                                                                                ...medicamentoTemp,
                                                                                concentracao: e.target.value
                                                                            })}
                                                                            label="Concentração"
                                                                        >
                                                                            {medications
                                                                                .find(m => m.name === medicamentoTemp.nome)?.dosages
                                                                                .map((dosage, idx) => (
                                                                                    <MenuItem key={idx} value={dosage}>
                                                                                        {dosage}
                                                                                    </MenuItem>
                                                                                ))}
                                                                        </Select>
                                                                    </FormControl>
                                                                ) : (
                                                                    <TextField
                                                                        fullWidth
                                                                        label="Concentração"
                                                                        placeholder="Ex: 500mg"
                                                                        value={medicamentoTemp.concentracao || ''}
                                                                        name="concentracao"
                                                                        onChange={handleMedicamentoTempChange}
                                                                        size="small"
                                                                    />
                                                                )}
                                                            </Grid>
                                                            <Grid item xs={12}>
                                                                <TextField
                                                                    fullWidth
                                                                    label="Posologia"
                                                                    placeholder="Ex: Tomar 1 comprimido a cada 6 horas em caso de dor"
                                                                    value={medicamentoTemp.posologia}
                                                                    name="posologia"
                                                                    onChange={handleMedicamentoTempChange}
                                                                    multiline
                                                                    rows={2}
                                                                    required
                                                                    size="small"
                                                                />
                                                            </Grid>
                                                            <Grid item xs={12} sm={6}>
                                                                <TextField
                                                                    fullWidth
                                                                    label="Quantidade"
                                                                    placeholder="Ex: 20 comprimidos"
                                                                    value={medicamentoTemp.quantidade}
                                                                    name="quantidade"
                                                                    onChange={handleMedicamentoTempChange}
                                                                    size="small"
                                                                />
                                                            </Grid>
                                                            <Grid item xs={12} sm={6}>
                                                                <TextField
                                                                    fullWidth
                                                                    label="Duração"
                                                                    placeholder="Ex: Por 7 dias"
                                                                    value={medicamentoTemp.duracao}
                                                                    name="duracao"
                                                                    onChange={handleMedicamentoTempChange}
                                                                    size="small"
                                                                />
                                                            </Grid>
                                                            <Grid item xs={12}>
                                                                <TextField
                                                                    fullWidth
                                                                    label="Observação"
                                                                    placeholder="Ex: Tomar após as refeições"
                                                                    value={medicamentoTemp.observacao}
                                                                    name="observacao"
                                                                    onChange={handleMedicamentoTempChange}
                                                                    multiline
                                                                    rows={2}
                                                                    size="small"
                                                                />
                                                            </Grid>
                                                            {medicamentoTemp.nome && !medications.some(m => m.name === medicamentoTemp.nome) && (
                                                                <Grid item xs={12}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                                                        <Tooltip title="Salvar este medicamento para uso futuro">
                                                                            <Button
                                                                                size="small"
                                                                                variant="outlined"
                                                                                color="secondary"
                                                                                startIcon={<BookmarkIcon />}
                                                                                onClick={async () => {
                                                                                    try {
                                                                                        // Verificar se o nome do medicamento está preenchido
                                                                                        if (!medicamentoTemp.nome.trim()) {
                                                                                            setSnackbar({
                                                                                                open: true,
                                                                                                message: "Nome do medicamento é obrigatório",
                                                                                                severity: "error"
                                                                                            });
                                                                                            return;
                                                                                        }

                                                                                        // Criar novo medicamento
                                                                                        const medicationData = {
                                                                                            name: medicamentoTemp.nome,
                                                                                            dosages: medicamentoTemp.concentracao ? [medicamentoTemp.concentracao] : [],
                                                                                            form: '',
                                                                                            instructions: medicamentoTemp.observacao || ''
                                                                                        };

                                                                                        await FirebaseService.createMedication(doctorId, medicationData);

                                                                                        // Atualizar a lista local de medicamentos
                                                                                        setMedications(prev => [...prev, {
                                                                                            ...medicationData,
                                                                                            id: Date.now().toString() // Id temporário até recarregar
                                                                                        }]);

                                                                                        setSnackbar({
                                                                                            open: true,
                                                                                            message: "Medicamento salvo para uso futuro",
                                                                                            severity: "success"
                                                                                        });
                                                                                    } catch (error) {
                                                                                        console.error("Erro ao salvar medicamento:", error);
                                                                                        setSnackbar({
                                                                                            open: true,
                                                                                            message: error.message || "Erro ao salvar medicamento",
                                                                                            severity: "error"
                                                                                        });
                                                                                    }
                                                                                }}
                                                                                sx={{ mr: 1 }}
                                                                            >
                                                                                Cadastrar medicamento
                                                                            </Button>
                                                                        </Tooltip>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            Cadastre este medicamento para reutilizá-lo em outras receitas
                                                                        </Typography>
                                                                    </Box>
                                                                </Grid>
                                                            )}
                                                        </Grid>

                                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                                                            <Button
                                                                variant="text"
                                                                onClick={handleCancelMedicamento}
                                                                sx={{ color: theme.palette.grey[600] }}
                                                            >
                                                                Cancelar
                                                            </Button>
                                                            <Button
                                                                variant="contained"
                                                                onClick={handleAddMedicamento}
                                                                disabled={!medicamentoTemp.nome || !medicamentoTemp.posologia}
                                                            >
                                                                {editingMedicamentoIndex !== null ? "Atualizar" : "Adicionar"}
                                                            </Button>
                                                        </Box>
                                                    </Paper>
                                                )}
                                            </Box>
                                        </Collapse>
                                    </Box>
                                </Paper>
                            )}
                        </Box>
                    </Box>
                </DialogContent>

                {/* Footer com botões de ação */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    p: 3,
                    pt: 2,
                    borderTop: '1px solid #EAECEF',
                    bgcolor: '#FCFCFD'
                }}>
                    <SecondaryButton
                        startIcon={<PictureAsPdfIcon />}
                        onClick={() => {
                            if (patientId || selectedPatient) {
                                const pdf = generateReceitaPDF();
                                pdf.save(`receita_${getPatientName().replace(/\s+/g, '_')}.pdf`);
                            } else {
                                setSnackbar({
                                    open: true,
                                    message: "Selecione um paciente para visualizar o PDF",
                                    severity: "warning"
                                });
                            }
                        }}
                        disabled={isSubmitting || (!patientId && !selectedPatient)}
                    >
                        Visualizar PDF
                    </SecondaryButton>

                    <PrimaryButton
                        onClick={handleSaveReceita}
                        disabled={isSubmitting || (!patientId && !selectedPatient)}
                        loading={isSubmitting}
                        success={isSaved}
                    >
                        {isSaved ? "Salvo com sucesso!" : isEditMode ? "Atualizar Receita" : "Salvar Receita"}
                    </PrimaryButton>
                </Box>

                {/* Snackbar para mensagens de feedback */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        onClose={handleCloseSnackbar}
                        severity={snackbar.severity}
                        sx={{ width: '100%' }}
                        variant="filled"
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </StyledDialog>
        </ThemeProvider>
    );
};

export default ReceitaDialog;