"use client";
import React, { useState, useEffect, useRef } from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    IconButton,
    Grid,
    useTheme,
    Snackbar,
    Alert,
    CircularProgress,
    Tooltip,
    Backdrop,
    Paper,
    LinearProgress,
    alpha
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckIcon from '@mui/icons-material/Check';
import AnamneseDialog from "./anamneseDialog";
import ReceitaDialog from "./receitasDialog";
import ExamDialog from "./examDialog";
import RelatorioDialog from "./relatorioDialog";
import FirebaseService from "../../../lib/firebaseService";

// Paleta de cores refinada
const themeColors = {
    primary: "#1852FE",
    textPrimary: "#111E5A",
    insight: "#8B5CF6",
    insightLight: "#F3E8FF",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    cardShadow: "0px 8px 24px 0px rgba(0, 0, 0, 0.04)",
    cardShadowHover: "0px 12px 28px 0px rgba(0, 0, 0, 0.1)",
    cardInsightShadow: "0px 8px 24px 0px rgba(139, 92, 246, 0.15)",
    cardInsightShadowHover: "0px 12px 28px 0px rgba(139, 92, 246, 0.25)"
};

// Card melhorado de Relatório Clínico
function RelatorioCard({ onClick, isLoading }) {
    return (
        <Card
            sx={{
                width: "100%",
                maxWidth: "200px",
                height: "200px",
                borderRadius: "20px",
                boxShadow: themeColors.cardInsightShadow,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                p: 2,
                cursor: "pointer",
                backgroundColor: themeColors.insightLight,
                overflow: "hidden",
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                    boxShadow: themeColors.cardInsightShadowHover,
                    transform: "translateY(-4px)",
                },
                "&::before": {
                    content: '""',
                    position: 'absolute',
                    top: '-30px',
                    right: '-30px',
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    zIndex: 0
                },
                "&::after": {
                    content: '""',
                    position: 'absolute',
                    bottom: '-20px',
                    left: '-20px',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    zIndex: 0
                }
            }}
            onClick={isLoading ? null : onClick}
        >
            <CardContent
                sx={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 0,
                    zIndex: 1
                }}
            >
                {/* Ícone central com animação suave */}
                <Box
                    sx={{
                        mt: "10px",
                        width: 100,
                        height: 100,
                        mb: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: themeColors.insight,
                        fontSize: 80,
                        position: "relative",
                        "&::after": {
                            content: '""',
                            position: 'absolute',
                            width: '70px',
                            height: '70px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(139, 92, 246, 0.1)',
                            zIndex: -1,
                            animation: 'pulse 2s infinite ease-in-out'
                        },
                        "@keyframes pulse": {
                            "0%": {
                                transform: "scale(0.95)",
                                boxShadow: "0 0 0 0 rgba(139, 92, 246, 0.3)"
                            },
                            "70%": {
                                transform: "scale(1.1)",
                                boxShadow: "0 0 0 10px rgba(139, 92, 246, 0)"
                            },
                            "100%": {
                                transform: "scale(0.95)",
                                boxShadow: "0 0 0 0 rgba(139, 92, 246, 0)"
                            }
                        }
                    }}
                >
                    {isLoading ? (
                        <CircularProgress size={50} color="secondary" />
                    ) : (
                        <PsychologyAltIcon sx={{ fontSize: 60 }} />
                    )}
                </Box>

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "row",
                        gap: 1,
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        pl: "10px",
                        pr: "10px",
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            color: themeColors.insight,
                            fontFamily: "Gellix",
                            fontSize: 22,
                            fontWeight: 600,
                            textAlign: "start",
                            flexGrow: 1,
                        }}
                    >
                        Resumo Clínico
                    </Typography>

                    <Tooltip title="Gerar relatório com IA">
                        <IconButton
                            sx={{
                                width: 28,
                                height: 28,
                                backgroundColor: themeColors.insight,
                                color: "#FFF",
                                "&:hover": {
                                    backgroundColor: "#7C3AED",
                                },
                                "&:disabled": {
                                    backgroundColor: "rgba(139, 92, 246, 0.5)",
                                }
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onClick && !isLoading) onClick(true);
                            }}
                            disabled={isLoading}
                        >
                            <AutoAwesomeIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </CardContent>
        </Card>
    );
}

// Card de acompanhamento aprimorado
function AcompanhamentoCard({ tipo, icone, onClick, variant = "default" }) {
    // Variante especial para o card de Resumo Clínico
    const isInsightVariant = variant === "insight";

    // Cores baseadas na variante
    const bgColor = isInsightVariant ? themeColors.insightLight : "white";
    const iconBgColor = isInsightVariant ? themeColors.insight : themeColors.primary;
    const iconHoverColor = isInsightVariant ? "#7C3AED" : "#0d47e0";
    const shadowBase = isInsightVariant ? themeColors.cardInsightShadow : themeColors.cardShadow;
    const shadowHover = isInsightVariant ? themeColors.cardInsightShadowHover : themeColors.cardShadowHover;

    return (
        <Card
            sx={{
                width: "100%",
                maxWidth: "200px",
                height: "200px",
                borderRadius: "20px",
                boxShadow: shadowBase,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                p: 2,
                cursor: "pointer",
                backgroundColor: bgColor,
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                    boxShadow: shadowHover,
                    transform: "translateY(-4px)",
                },
            }}
            onClick={onClick}
        >
            <CardContent
                sx={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 0,
                }}
            >
                {/* Ícone central com animação suave no hover */}
                {typeof icone === "string" ? (
                    <Box
                        component="img"
                        src={icone}
                        alt={tipo}
                        sx={{
                            mt: "10px",
                            width: 115,
                            height: 125,
                            mb: 1,
                            transition: "transform 0.3s ease",
                            "&:hover": {
                                transform: "scale(1.05)"
                            }
                        }}
                    />
                ) : (
                    <Box
                        sx={{
                            mt: "10px",
                            width: 115,
                            height: 125,
                            mb: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: isInsightVariant ? themeColors.insight : themeColors.primary,
                            fontSize: 80,
                            transition: "transform 0.3s ease",
                            "&:hover": {
                                transform: "scale(1.05)"
                            }
                        }}
                    >
                        {icone}
                    </Box>
                )}

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "row",
                        gap: 2,
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        pl: "10px",
                        pr: "10px",
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            color: isInsightVariant ? themeColors.insight : themeColors.textPrimary,
                            fontFamily: "Gellix",
                            fontSize: 24,
                            fontWeight: 500,
                            textAlign: "start",
                            flexGrow: 1,
                        }}
                    >
                        {tipo}
                    </Typography>

                    <Tooltip title={`Adicionar ${tipo}`}>
                        <IconButton
                            sx={{
                                width: 28,
                                height: 28,
                                backgroundColor: iconBgColor,
                                color: "#FFF",
                                "&:hover": {
                                    backgroundColor: iconHoverColor,
                                },
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onClick) onClick(true);
                            }}
                        >
                            {isInsightVariant ? <AutoAwesomeIcon /> : <AddIcon />}
                        </IconButton>
                    </Tooltip>
                </Box>
            </CardContent>
        </Card>
    );
}

// Função utilitária para formatar datas com segurança
const formatDateString = (dateValue) => {
    if (!dateValue) return "";

    try {
        // Se já for uma string no formato YYYY-MM-DD, retornar diretamente
        if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            return dateValue;
        }

        // Se for um objeto Timestamp do Firestore
        if (dateValue && typeof dateValue.toDate === 'function') {
            const date = dateValue.toDate();
            return date.toISOString().split('T')[0];
        }

        // Se for um objeto Date
        if (dateValue instanceof Date) {
            return dateValue.toISOString().split('T')[0];
        }

        // Tentar converter para Date
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
            throw new Error('Data inválida');
        }

        return date.toISOString().split('T')[0];
    } catch (error) {
        console.warn("Erro ao formatar data:", error);
        return new Date().toISOString().split('T')[0]; // Fallback para data atual
    }
};

// Componente principal aprimorado
export default function AcompanhamentoSection({ pacienteId, doctorId, patientData = null, onNotaUpdated, forceUpdateNotas }) {
    const theme = useTheme();
    const [openAnamneseDialog, setOpenAnamneseDialog] = useState(false);
    const [openReceitaDialog, setOpenReceitaDialog] = useState(false);
    const [openExamDialog, setOpenExamDialog] = useState(false);
    const [openRelatorioDialog, setOpenRelatorioDialog] = useState(false);
    const [isLoadingRelatorio, setIsLoadingRelatorio] = useState(false);
    const [relatorioData, setRelatorioData] = useState(null);
    const [allExams, setAllExams] = useState([]);
    const [allNotes, setAllNotes] = useState([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("info");
    const [localPatientData, setLocalPatientData] = useState(patientData);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [currentProcessingFile, setCurrentProcessingFile] = useState(null);
    const [processingProgress, setProcessingProgress] = useState(0);

    // Referência para controlar as etapas de carregamento no indicador
    const [loadingStage, setLoadingStage] = useState(0);
    const loadingStages = [
        "Recuperando dados do paciente...",
        "Processando histórico clínico...",
        "Analisando exames recentes...",
        "Avaliando medicações e tratamentos...",
        "Gerando insights clínicos..."
    ];

    // Buscar dados do paciente se não forem fornecidos como prop
    useEffect(() => {
        const loadPatientData = async () => {
            // Se já temos dados do paciente das props, usamos eles
            if (patientData) {
                setLocalPatientData(patientData);
                return;
            }

            // Se não temos dados, buscamos do Firebase
            if (pacienteId && doctorId && !localPatientData) {
                try {
                    console.log("Buscando dados do paciente do Firebase:", pacienteId);
                    const data = await FirebaseService.getPatient(doctorId, pacienteId);
                    if (data) {
                        console.log("Dados do paciente obtidos com sucesso");
                        setLocalPatientData(data);
                    } else {
                        console.error("Paciente não encontrado no Firebase");
                        showSnackbar("Dados do paciente não encontrados", "error");
                    }
                } catch (err) {
                    console.error("Erro ao buscar dados do paciente:", err);
                    showSnackbar("Erro ao buscar dados do paciente", "error");
                }
            }
        };

        loadPatientData();
    }, [pacienteId, doctorId, patientData]);

    // Atualizar localPatientData quando patientData mudar
    useEffect(() => {
        if (patientData) {
            setLocalPatientData(patientData);
        }
    }, [patientData]);

    // Carregar exames e notas ao montar o componente
    useEffect(() => {
        if (pacienteId && doctorId) {
            const fetchPatientData = async () => {
                try {
                    setIsDataLoaded(false);

                    // Buscar exames
                    const exams = await FirebaseService.listExams(doctorId, pacienteId);
                    console.log(`Exames carregados: ${exams?.length || 0}`);
                    setAllExams(exams || []);

                    // Buscar notas
                    const notes = await FirebaseService.listNotes(doctorId, pacienteId);
                    console.log(`Notas carregadas: ${notes?.length || 0}`);
                    setAllNotes(notes || []);

                    setIsDataLoaded(true);
                } catch (err) {
                    console.error("Erro ao carregar dados do paciente:", err);
                    showSnackbar("Falha ao carregar dados do paciente", "error");
                    setIsDataLoaded(true); // Marcar como carregado mesmo com erro para evitar loader infinito
                }
            };

            fetchPatientData();
        }
    }, [pacienteId, doctorId]);

    // Efeito para simular progressão nas etapas de carregamento
    useEffect(() => {
        let timer;
        if (isLoadingRelatorio) {
            setLoadingStage(0);
            let currentStage = 0;

            const advanceStage = () => {
                if (currentStage < loadingStages.length - 1) {
                    currentStage++;
                    setLoadingStage(currentStage);

                    // Intervalo variável para simular diferentes tempos de processamento
                    const nextDelay = 800 + Math.random() * 1200;
                    timer = setTimeout(advanceStage, nextDelay);
                }
            };

            // Iniciar após um curto delay
            timer = setTimeout(advanceStage, 800);
        }

        return () => clearTimeout(timer);
    }, [isLoadingRelatorio]);

    const showSnackbar = (message, severity = "info") => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    const handleAnamneseClick = (isAdd) => {
        setOpenAnamneseDialog(true);
    };

    const handleReceitasClick = (isAdd) => {
        setOpenReceitaDialog(true);
    };

    const handleExamesClick = (isAdd) => {
        setOpenExamDialog(true);
    };

    // Função para preparar os dados do paciente para a IA
    const preparePatientDataForAI = () => {
        if (!localPatientData) {
            console.error("Dados do paciente não disponíveis para preparação");
            return null;
        }

        try {
            // SEÇÃO 1: DADOS DEMOGRÁFICOS - Prioridade Alta
            const basicInfo = {
                id: pacienteId,
                nome: localPatientData.nome || localPatientData.patientName || "Paciente",
                dataNascimento: localPatientData.dataNascimento || localPatientData.birthDate || "",
                idade: calculateAge(localPatientData.dataNascimento || localPatientData.birthDate),
                genero: localPatientData.gender || "",
                tipoSanguineo: localPatientData.tipoSanguineo || localPatientData.bloodType || "",
            };

            // SEÇÃO 2: CONDIÇÕES MÉDICAS ATUAIS - Prioridade Alta
            const conditionsAndAllergies = {
                doencasCronicas: processMedicalConditions(localPatientData.chronicDiseases || []),
                cirurgias: processArrayData(localPatientData.cirurgias || (localPatientData.condicoesClinicas?.cirurgias || [])),
                alergias: processArrayData(localPatientData.alergias || localPatientData.allergies || (localPatientData.condicoesClinicas?.alergias || [])),
                atividadeFisica: localPatientData.atividadeFisica || (localPatientData.condicoesClinicas?.atividades || []),
                historicoFamiliar: localPatientData.historicoMedico || (localPatientData.historicoConduta?.doencasHereditarias || ""),
                status: localPatientData.statusList || []
            };

            // SEÇÃO 3: EXAMES - Prioridade Alta (principalmente os mais recentes e com valores fora do normal)
            const recentExams = processExamData(allExams || []);

            // SEÇÃO 4: MEDICAÇÕES - Prioridade Alta (atual)
            const currentMedications = processRecentMedications(allNotes || []);

            // SEÇÃO 5: ANAMNESE E CONSULTAS - Prioridade Média (resumido)
            const consultationNotes = processConsultationNotes(allNotes || [], 5); // Limita apenas às 5 mais recentes

            // SEÇÃO 6: PLANO DE SAÚDE - Prioridade Baixa
            const insuranceData = {
                planoSaude: localPatientData.healthPlan?.name || "",
                numeroPlano: localPatientData.healthPlan?.number || ""
            };

            // Retorna objeto completo com prioridades claras
            return {
                patientProfile: basicInfo,
                medicalConditions: conditionsAndAllergies,
                recentExams: recentExams.slice(0, 15), // Apenas os 15 exames mais recentes
                medications: currentMedications.slice(0, 10), // Apenas as 10 medicações mais recentes
                recentConsultations: consultationNotes,
                healthInsurance: insuranceData,
                priority_data_flags: {
                    has_chronic_diseases: conditionsAndAllergies.doencasCronicas.length > 0,
                    has_allergies: conditionsAndAllergies.alergias.length > 0,
                    has_recent_exams: recentExams.length > 0,
                    has_current_medications: currentMedications.length > 0,
                    special_status: conditionsAndAllergies.status.includes("Internado") ? "Internado" :
                        (conditionsAndAllergies.status.includes("Emergência") ? "Emergência" : "Regular")
                }
            };
        } catch (error) {
            console.error("Erro ao preparar dados do paciente:", error);
            throw new Error("Falha ao preparar dados do paciente para análise: " + error.message);
        }
    };

    // Funções auxiliares para processamento de dados
    const calculateAge = (birthDateStr) => {
        if (!birthDateStr) return null;

        try {
            // Suporta tanto formato ISO (YYYY-MM-DD) quanto brasileiro (DD/MM/YYYY)
            let birthDate;
            if (birthDateStr.includes('-')) {
                birthDate = new Date(birthDateStr);
            } else if (birthDateStr.includes('/')) {
                const [day, month, year] = birthDateStr.split('/');
                birthDate = new Date(year, month - 1, day);
            } else {
                birthDate = new Date(birthDateStr);
            }

            if (isNaN(birthDate.getTime())) return null;

            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            return age;
        } catch (e) {
            console.warn("Erro ao calcular idade:", e);
            return null;
        }
    };

    const processMedicalConditions = (conditions) => {
        if (!Array.isArray(conditions)) return [];

        // Filtrar valores vazios ou nulos
        return conditions
            .filter(condition => condition && typeof condition === 'string' && condition.trim() !== '')
            .map(condition => condition.trim());
    };

    const processArrayData = (array) => {
        if (!Array.isArray(array)) return [];

        return array
            .filter(item => item && (typeof item === 'string' ? item.trim() !== '' : true))
            .map(item => typeof item === 'string' ? item.trim() : item);
    };

    const processExamData = (exams) => {
        if (!Array.isArray(exams) || exams.length === 0) return [];

        // Ordenar por data (mais recentes primeiro)
        const sortedExams = [...exams].sort((a, b) => {
            const dateA = a.examDate ? new Date(a.examDate) :
                (a.createdAt ? new Date(a.createdAt) : new Date());
            const dateB = b.examDate ? new Date(b.examDate) :
                (b.createdAt ? new Date(b.createdAt) : new Date());
            return dateB - dateA;
        });

        // Mapeia exames para formato simplificado, destacando resultados fora do normal
        return sortedExams.map(exam => {
            // Detecta resultados possivelmente anormais
            const abnormalResults = exam.results ? findAbnormalResults(exam.results) : [];

            return {
                id: exam.id || "",
                titulo: exam.title || "Exame sem título",
                data: formatDateString(exam.examDate || exam.createdAt || new Date()),
                categoria: exam.category || "LabGerais",
                resultados: exam.results || {},
                resultadosAnormais: abnormalResults,
                hasAbnormalResults: abnormalResults.length > 0
            };
        });
    };

    const findAbnormalResults = (results) => {
        const abnormalMarkers = [];

        // Procura por marcadores em categorias comuns de exames
        for (const category in results) {
            for (const examName in results[category]) {
                const value = results[category][examName];
                const valueStr = String(value).toLowerCase();

                // Detecta valores anormais por palavras-chave comuns em laudos
                if (valueStr.includes('alterado') ||
                    valueStr.includes('anormal') ||
                    valueStr.includes('elevad') ||
                    valueStr.includes('aument') ||
                    valueStr.includes('reduzid') ||
                    valueStr.includes('abaixo') ||
                    valueStr.includes('acima') ||
                    valueStr.includes('positivo') ||
                    valueStr.includes('fora') ||
                    /[+*]$/.test(valueStr)) {

                    abnormalMarkers.push({
                        categoria: category,
                        exame: examName,
                        valor: value
                    });
                }
            }
        }

        return abnormalMarkers;
    };

    const processRecentMedications = (notes) => {
        if (!Array.isArray(notes)) return [];

        // Filtrar apenas notas do tipo "Receita"
        const prescriptions = notes.filter(note => note.noteType === "Receita")
            .sort((a, b) => {
                const dateA = a.createdAt ?
                    (typeof a.createdAt.toDate === 'function' ?
                        a.createdAt.toDate() : new Date(a.createdAt)) : new Date();
                const dateB = b.createdAt ?
                    (typeof b.createdAt.toDate === 'function' ?
                        b.createdAt.toDate() : new Date(b.createdAt)) : new Date();
                return dateB - dateA;
            });

        // Extrair medicamentos das receitas mais recentes
        const medications = [];

        for (const prescription of prescriptions) {
            const meds = prescription.medicamentos || prescription.medications || [];

            for (const med of meds) {
                if (med.name || med.nome) {
                    medications.push({
                        nome: med.name || med.nome,
                        dosagem: med.dosage || med.dosagem || "",
                        frequencia: med.frequency || med.frequencia || "",
                        dataReceita: formatDateString(prescription.createdAt || new Date()),
                        observacoes: med.observations || med.observacoes || ""
                    });
                }
            }
        }

        return medications;
    };

    const processConsultationNotes = (notes, limit = 5) => {
        if (!Array.isArray(notes)) return [];

        // Filtrar os tipos relevantes de nota
        const consultations = notes
            .filter(note =>
                note.noteType === "Anamnese" ||
                note.noteType === "Consulta" ||
                (note.noteType && !["Receita", "Exame"].includes(note.noteType)))
            .sort((a, b) => {
                const dateA = a.createdAt ?
                    (typeof a.createdAt.toDate === 'function' ?
                        a.createdAt.toDate() : new Date(a.createdAt)) : new Date();
                const dateB = b.createdAt ?
                    (typeof b.createdAt.toDate === 'function' ?
                        b.createdAt.toDate() : new Date(b.createdAt)) : new Date();
                return dateB - dateA;
            })
            .slice(0, limit); // Limitar à quantidade solicitada

        return consultations.map(note => {
            if (note.noteType === "Anamnese") {
                return {
                    tipo: "Anamnese",
                    data: formatDateString(note.createdAt || new Date()),
                    queixaPrincipal: note.queixaPrincipal || "",
                    historiaDoencaAtual: note.historiaDoencaAtual || "",
                    diagnostico: note.diagnostico || ""
                };
            } else {
                return {
                    tipo: note.noteType || "Consulta",
                    data: formatDateString(note.consultationDate || note.createdAt || new Date()),
                    titulo: note.noteTitle || "Nota de consulta",
                    texto: summarizeText(note.noteText || "", 200) // Resumir o texto para economizar tokens
                };
            }
        });
    };

    const summarizeText = (text, maxLength = 200) => {
        if (!text || text.length <= maxLength) return text;

        return text.substring(0, maxLength) + "...";
    };

    // Handler for opening relatório dialog with improved user feedback
    const handleRelatorioClick = async (isGenerate) => {
        // Verificar se temos dados do paciente antes de prosseguir
        if (!localPatientData) {
            showSnackbar("Dados do paciente não disponíveis. Aguarde o carregamento ou atualize a página.", "error");
            return;
        }

        // Verificar se os dados já foram carregados
        if (!isDataLoaded) {
            showSnackbar("Aguarde, os dados ainda estão sendo carregados...", "info");
            return;
        }

        if (isGenerate) {
            // Se clicou no botão "gerar", gerar novo relatório
            await generateRelatorio();
        } else {
            // Se clicou no card, apenas abrir o diálogo com dados existentes ou gerar se não existir
            if (relatorioData) {
                setOpenRelatorioDialog(true);
            } else {
                await generateRelatorio();
            }
        }
    };

    // Função otimizada para gerar o relatório com feedback visual aprimorado
    const generateRelatorio = async () => {
        setIsLoadingRelatorio(true);
        setCurrentProcessingFile("dados do paciente");
        setProcessingProgress(0);

        // Iniciar animação de progresso
        const progressInterval = setInterval(() => {
            setProcessingProgress(prev => {
                // Simular progresso até 90% (os últimos 10% quando a resposta chega)
                const newProgress = prev + (Math.random() * 2);
                return newProgress >= 90 ? 90 : newProgress;
            });
        }, 300);

        try {
            // Verificação crítica - necessitamos dos dados do paciente
            if (!localPatientData) {
                throw new Error("Dados do paciente não disponíveis");
            }

            if (!isDataLoaded) {
                throw new Error("Aguarde, os dados ainda estão sendo carregados");
            }

            // Preparar dados do paciente com a função melhorada
            const patientDataForAI = preparePatientDataForAI();

            if (!patientDataForAI) {
                throw new Error("Dados do paciente insuficientes para análise");
            }

            console.log("Enviando dados para API de relatório...");

            // Enviar para API
            const response = await fetch('/api/relatorio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pacienteData: patientDataForAI,
                    doctorId: doctorId,
                    patientId: pacienteId
                }),
            });

            if (!response.ok) {
                let errorMsg = `Erro na API: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.error || errorMsg;
                } catch (e) {
                    // Ignorar erro ao processar resposta JSON
                }
                throw new Error(errorMsg);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || "Falha ao gerar relatório");
            }

            // Guardar dados do relatório
            setRelatorioData(result.data);

            // Completar o progresso para 100%
            setProcessingProgress(100);

            // Pequena pausa para o usuário ver o progresso completo
            await new Promise(resolve => setTimeout(resolve, 500));

            // Abrir diálogo para exibir o relatório
            setOpenRelatorioDialog(true);

            // Mostrar snackbar de sucesso
            showSnackbar("Relatório clínico gerado com sucesso!", "success");

        } catch (error) {
            console.error("Erro ao gerar relatório:", error);
            showSnackbar("Erro ao gerar relatório clínico: " + error.message, "error");
        } finally {
            clearInterval(progressInterval);
            setIsLoadingRelatorio(false);
            setCurrentProcessingFile(null);
            setProcessingProgress(0);
        }
    };

    // Update handlers for saving/updating
    const handleSaveAnamnese = async (anamneseId) => {
        console.log(`Anamnese ${anamneseId} salva com sucesso!`);
        setOpenAnamneseDialog(false);

        if (forceUpdateNotas) {
            console.log("Forçando atualização de notas após salvar anamnese");
            await forceUpdateNotas();
        }

        if (onNotaUpdated) {
            onNotaUpdated();
        }

        showSnackbar("Anamnese salva com sucesso!", "success");
    };

    const handleSaveReceita = async (receitaId) => {
        console.log(`Receita ${receitaId} salva com sucesso!`);
        setOpenReceitaDialog(false);

        if (forceUpdateNotas) {
            console.log("Forçando atualização de notas após salvar receita");
            await forceUpdateNotas();
        }

        if (onNotaUpdated) {
            onNotaUpdated();
        }

        showSnackbar("Receita salva com sucesso!", "success");
    };

    // Add handler for saving exams
    const handleSaveExam = async (examData) => {
        try {
            console.log("Salvando exame:", examData);
            // Create the exam using Firebase service
            const examId = await FirebaseService.createExam(doctorId, pacienteId, examData);

            console.log(`Exame ${examId} salvo com sucesso!`);
            setOpenExamDialog(false);

            // Force update notes if available
            if (forceUpdateNotas) {
                console.log("Forçando atualização de notas após salvar exame");
                await forceUpdateNotas();
            }

            // Notify parent component
            if (onNotaUpdated) {
                onNotaUpdated();
            }

            // Atualizar a lista local de exames
            const updatedExams = [...allExams, {...examData, id: examId}];
            setAllExams(updatedExams);

            showSnackbar("Exame salvo com sucesso!", "success");

            return examId;
        } catch (error) {
            console.error("Erro ao salvar exame:", error);
            showSnackbar("Erro ao salvar exame. Por favor, tente novamente.", "error");
            return null;
        }
    };

    // Close handlers
    const handleCloseExamDialog = () => {
        setOpenExamDialog(false);
    };

    const handleCloseRelatorioDialog = () => {
        setOpenRelatorioDialog(false);
    };

    return (
        <Box sx={{ width: "100%", maxWidth: "840px" }}>
            {/* Loading animation quando gerando relatório */}
            {isLoadingRelatorio && (
                <Backdrop
                    sx={{
                        position: 'fixed',
                        zIndex: 9999,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    open={true}
                >
                    <Paper
                        elevation={3}
                        sx={{
                            p: 4,
                            borderRadius: '16px',
                            maxWidth: '420px',
                            textAlign: 'center'
                        }}
                    >
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                backgroundColor: alpha('#8B5CF6', 0.3),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px'
                            }}
                        >
                            <AutoAwesomeIcon
                                sx={{
                                    fontSize: 40,
                                    color: '#8B5CF6',
                                    animation: 'pulse 1.5s infinite'
                                }}
                            />
                        </Box>

                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#8B5CF6' }}>
                            Gerando Relatório Clínico
                        </Typography>

                        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                            {loadingStages[loadingStage]}
                        </Typography>

                        <Box sx={{ width: '100%', mb: 2 }}>
                            <LinearProgress
                                variant="determinate"
                                value={processingProgress}
                                sx={{
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: alpha('#8B5CF6', 0.2),
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: '#8B5CF6',
                                        borderRadius: 5
                                    }
                                }}
                            />
                        </Box>

                        <Typography variant="body2" color="text.secondary">
                            {`${Math.round(processingProgress)}% - Processando dados clínicos...`}
                        </Typography>

                        <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {loadingStages.map((stage, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        opacity: index <= loadingStage ? 1 : 0.4,
                                        transition: 'opacity 0.3s ease'
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            backgroundColor: index <= loadingStage ? '#8B5CF6' : '#e0e0e0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mr: 2,
                                            transition: 'background-color 0.3s ease'
                                        }}
                                    >
                                        {index < loadingStage && (
                                            <CheckIcon sx={{ fontSize: 16, color: 'white' }} />
                                        )}
                                    </Box>
                                    <Typography
                                        variant="body2"
                                        color={index <= loadingStage ? "textPrimary" : "textSecondary"}
                                    >
                                        {stage}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Backdrop>
            )}

            {/* Adicione este estilo para a animação de pulso */}
            <style jsx global>{`
                @keyframes pulse {
                    0% {
                        filter: drop-shadow(0 0 0 #8B5CF6);
                        transform: scale(1);
                    }
                    50% {
                        filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.4));
                        transform: scale(1.1);
                    }
                    100% {
                        filter: drop-shadow(0 0 0 #8B5CF6);
                        transform: scale(1);
                    }
                }
            `}</style>

            {/* Title with enhanced typography */}
            <Typography
                variant="h4"
                sx={{
                    color: themeColors.textPrimary,
                    fontFamily: "Gellix",
                    fontSize: "30px",
                    fontWeight: 500,
                    mb: 3,
                }}
            >
                Acompanhamento
            </Typography>

            {/* Grid of cards with improved layout */}
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <AcompanhamentoCard
                        tipo="Anamnese"
                        icone="/anamnesecard.svg"
                        onClick={handleAnamneseClick}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <AcompanhamentoCard
                        tipo="Receitas"
                        icone="/receitascard.svg"
                        onClick={handleReceitasClick}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <AcompanhamentoCard
                        tipo="Exames"
                        icone="/examescard.png"
                        onClick={handleExamesClick}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <RelatorioCard
                        onClick={handleRelatorioClick}
                        isLoading={isLoadingRelatorio}
                    />
                </Grid>
            </Grid>

            {/* Dialogs */}
            <AnamneseDialog
                open={openAnamneseDialog}
                onClose={() => setOpenAnamneseDialog(false)}
                patientId={pacienteId}
                doctorId={doctorId}
                onSave={handleSaveAnamnese}
            />

            <ReceitaDialog
                open={openReceitaDialog}
                onClose={() => setOpenReceitaDialog(false)}
                patientId={pacienteId}
                doctorId={doctorId}
                onSave={handleSaveReceita}
            />

            <ExamDialog
                open={openExamDialog}
                onClose={handleCloseExamDialog}
                patientId={pacienteId}
                doctorId={doctorId}
                onSave={handleSaveExam}
            />

            {/* Diálogo do Relatório Clínico melhorado */}
            {(openRelatorioDialog || relatorioData) && (
                <RelatorioDialog
                    open={openRelatorioDialog}
                    onClose={handleCloseRelatorioDialog}
                    relatorioData={relatorioData}
                    patientData={localPatientData}
                    onGenerate={generateRelatorio}
                    isLoading={isLoadingRelatorio}
                />
            )}

            {/* Snackbar para notificações */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={5000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    elevation={6}
                    variant="filled"
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}