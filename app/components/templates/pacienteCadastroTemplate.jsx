"use client";

import React, { useState } from "react";
import {
    Box,
    Typography,
    Button,
    IconButton,
    Snackbar,
    Alert,
    styled,
    CircularProgress, Slide,
} from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import InfoBasicasForm from "../features/patients/InformacoesBasicas";
import CondicoesClinicasForm from "../features/patients/CondicoesClinicas";
import ConductHistoryForm from "../features/shared/ConductHistory";

// Importa o serviço de pacientes da API (doctor-server)
import { patientsService } from '@/lib/services/api';
import { storageService } from '@/lib/services/firebase';

// Importa o AuthProvider (useAuth) para obter o id do usuário autenticado
import { useAuth } from "../providers/authProvider";
import useModuleAccess from "../hooks/useModuleAccess";

// ------------------ ESTILOS ------------------
const PageContainer = styled(Box)(({ theme }) => ({
    position: "relative", // necessário para posicionar o overlay de loading
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
    width: "100%",
    backgroundColor: "#F4F9FF",
    padding: theme.spacing(3),
    boxSizing: "border-box",
    minHeight: "100vh",
}));

const SectionContainer = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(3),
}));

const SectionHeader = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(1),
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
    color: "#111E5A",
    fontFamily: "Gellix, sans-serif",
    fontSize: "18px",
    fontWeight: 600,
    lineHeight: "24px",
}));

const SectionContent = styled(Box)(({ theme }) => ({
    backgroundColor: "#FFFFFF",
    border: "1px solid #EAECEF",
    borderRadius: "16px",
    padding: theme.spacing(3),
}));

const ActionButtonsContainer = styled(Box)(({ theme }) => ({
    display: "flex",
    justifyContent: "center",
    gap: theme.spacing(2),
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(5),
    flexDirection: "column",
    alignItems: "center",
    [theme.breakpoints.up("sm")]: {
        flexDirection: "row",
    },
}));

const ActionButton = styled(Button)(({ theme, variant }) => ({
    borderRadius: "999px",
    padding: "10px 36px",
    fontFamily: "Gellix, sans-serif",
    textTransform: "none",
    fontSize: "16px",
    fontWeight: 500,
    transition: "all 0.2s ease-in-out",
    boxShadow:
        variant === "contained"
            ? "0px 4px 10px rgba(17, 30, 90, 0.1)"
            : "none",
    ...(variant === "contained"
        ? {
            backgroundColor: "#1852FE",
            color: "white",
            "&:hover": {
                backgroundColor: "#0A144A",
                transform: "translateY(-2px)",
                boxShadow: "0px 6px 12px rgba(17, 30, 90, 0.2)",
            },
        }
        : {
            color: "#111E5A",
            borderColor: "#111E5A",
            "&:hover": {
                borderColor: "#0A144A",
                backgroundColor: "rgba(17, 30, 90, 0.04)",
            },
        }),
}));

const LoadingOverlay = styled(Box)(({ theme }) => ({
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1500,
    backdropFilter: "blur(8px)",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
}));

export default function PacienteCadastroTemplate() {
    // Obtenha o id do usuário (doctorId) a partir do AuthProvider
    const { user, getEffectiveUserId } = useAuth();
    const { canPerformAction } = useModuleAccess();
    const [patientId, setPatientId] = useState(null);

    // Estado para controlar seções expandidas
    const [expandedSections, setExpandedSections] = useState({
        infoBasicas: true,
        condicoesClinicas: true,
        historicoConduta: true,
    });

    // Estado para dados do formulário
    const [formData, setFormData] = useState({
        infoBasicas: {
            nome: "",
            dataNascimento: "",
            tipoSanguineo: "",
            genero: "",
            endereco: "",
            cidade: "",
            estado: "",
            cpf: "",
            email: "",
            telefone: "",
            cep: "",
            // Novo campo para a foto
            patientPhoto: null,
        },
        condicoesClinicas: {
            medicamentos: [],
            doencas: [],
            alergias: [],
            cirurgias: [],
            atividades: [],
            consumeAlcool: "Não",
            ehFumante: "Não",
        },
        historicoConduta: {
            doencasHereditarias: "",
            condutaInicial: "",
            // Substituir arquivoAnexo por healthPlans
            healthPlans: []
        },
    });

    // Estado para validação
    const [errors, setErrors] = useState({});

    const [resetTrigger, setResetTrigger] = useState(0);

    // Estado para feedback (Snackbar)
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    // Estado para controle de loading ao submeter
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Verificar se o usuário tem permissão para criar pacientes
    const canCreatePatients = canPerformAction('patients', 'create');
    
    // Se não tem permissão, mostrar acesso negado
    if (!canCreatePatients.allowed) {
        return (
            <PageContainer>
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    textAlign: 'center',
                    p: 3
                }}>
                    <Typography variant="h5" color="error" gutterBottom>
                        Acesso Negado
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Você não tem permissão para criar novos pacientes.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Entre em contato com o médico responsável para solicitar essa permissão.
                    </Typography>
                </Box>
            </PageContainer>
        );
    }

    const resetForm = () => {
        setFormData({
            infoBasicas: {
                nome: "",
                dataNascimento: "",
                tipoSanguineo: "",
                genero: "",
                endereco: "",
                cidade: "",
                estado: "",
                cpf: "",
                email: "",
                telefone: "",
                cep: "",
                patientPhoto: null,
            },
            condicoesClinicas: {
                medicamentos: [],
                doencas: [],
                alergias: [],
                cirurgias: [],
                atividades: [],
                consumeAlcool: "Não",
                ehFumante: "Não",
            },
            historicoConduta: {
                doencasHereditarias: "",
                condutaInicial: "",
                healthPlans: []
            },
        });

        setResetTrigger(prev => prev + 1);
    };


    // Função para atualizar dados de cada seção do form
    const updateFormData = (section, data) => {
        setFormData((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                ...data,
            },
        }));
    };

    // Função para alternar expandir/contrair seções
    const handleToggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    // Validação simples
    const validateForm = () => {
        const newErrors = {};

        // Apenas validar se o nome está preenchido como obrigatório
        if (!formData.infoBasicas.nome || formData.infoBasicas.nome.trim() === '') {
            newErrors.nome = "Nome do paciente é obrigatório";
        }

        // Validar o formato do email APENAS se um email foi fornecido
        if (formData.infoBasicas.email && !/\S+@\S+\.\S+/.test(formData.infoBasicas.email)) {
            newErrors.email = "Formato de email inválido";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Função de submit
    const handleSubmit = async () => {
        if (!validateForm()) {
            const errorFields = Object.keys(errors);
            setSnackbar({
                open: true,
                message: `Verifique os campos obrigatórios: ${errorFields.join(", ")}`,
                severity: "error",
            });
            return;
        }

        const effectiveUserId = getEffectiveUserId();
        if (!user || !effectiveUserId) {
            setSnackbar({
                open: true,
                message: "Usuário não autenticado.",
                severity: "error",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const doctorId = getEffectiveUserId();

            // Mapeie os campos dos formulários para o modelo esperado pela API
            const patientData = {
                // Dados básicos
                patientName: formData.infoBasicas.nome,
                birthDate: formData.infoBasicas.dataNascimento,
                patientGender: formData.infoBasicas.genero,
                patientCPF: formData.infoBasicas.cpf,
                patientEmail: formData.infoBasicas.email,
                patientPhone: formData.infoBasicas.telefone,

                // Endereço (formato esperado pela API)
                address: {
                    logradouro: formData.infoBasicas.endereco,
                    cidade: formData.infoBasicas.cidade,
                    uf: formData.infoBasicas.estado,
                    cep: formData.infoBasicas.cep,
                },

                // Dados médicos
                bloodType: formData.infoBasicas.tipoSanguineo,
                isSmoker: formData.condicoesClinicas.ehFumante === "Sim",
                isAlcoholConsumer: formData.condicoesClinicas.consumeAlcool === "Sim",

                // Históricos médicos
                allergies: formData.condicoesClinicas.alergias || [],
                chronicDiseases: formData.condicoesClinicas.doencas || [],
                medications: formData.condicoesClinicas.medicamentos || [],
                surgicalHistory: formData.condicoesClinicas.cirurgias || [],
                familyHistory: formData.historicoConduta.doencasHereditarias
                    ? [formData.historicoConduta.doencasHereditarias]
                    : [],

                // Plano de saúde (primeiro plano se houver)
                healthPlan: (formData.historicoConduta.healthPlans?.length > 0)
                    ? {
                        name: formData.historicoConduta.healthPlans[0].name,
                        number: formData.historicoConduta.healthPlans[0].number,
                        validUntil: formData.historicoConduta.healthPlans[0].validUntil,
                    }
                    : undefined,

                // Observações (conduta inicial)
                notes: formData.historicoConduta.condutaInicial || undefined,
            };

            // Cria o paciente via API (doctor-server)
            const createdPatient = await patientsService.create(patientData);
            const newPatientId = createdPatient.id;

            // Upload de foto do paciente (ainda usa Firebase Storage)
            if (formData.infoBasicas.patientPhoto && newPatientId) {
                try {
                    const photoPath = `users/${doctorId}/patients/${newPatientId}/profilePhoto/${Date.now()}_${formData.infoBasicas.patientPhoto.name}`;
                    const photoUrl = await storageService.uploadFile(
                        formData.infoBasicas.patientPhoto,
                        photoPath
                    );
                    // Atualiza o paciente com a URL da foto
                    await patientsService.update(newPatientId, { photoURL: photoUrl });
                } catch (photoError) {
                    console.warn("Erro ao fazer upload da foto (não crítico):", photoError);
                }
            }

            setPatientId(newPatientId);

            setSnackbar({
                open: true,
                message: "Paciente cadastrado com sucesso!",
                severity: "success",
            });

            // Resetar formulário após cadastro bem-sucedido
            resetForm();

        } catch (error) {
            console.error("Erro ao cadastrar paciente:", error);
            setSnackbar({
                open: true,
                message: `Erro ao cadastrar paciente: ${error.message}`,
                severity: "error",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Função para fechar o Snackbar
    const handleCloseSnackbar = () => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    return (
        <PageContainer>
            {isSubmitting && (
                <LoadingOverlay>
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        backgroundColor: 'white',
                        p: 3,
                        borderRadius: 2,
                        boxShadow: 3
                    }}>
                        <CircularProgress size={60} color="primary" />
                        <Typography sx={{ mt: 2, fontWeight: 500 }}>
                            Salvando paciente...
                        </Typography>
                    </Box>
                </LoadingOverlay>
            )}
            {/* Seção de Informações Básicas */}
            <SectionContainer>
                <SectionHeader>
                    <SectionTitle>Informações Básicas</SectionTitle>
                    <IconButton onClick={() => handleToggleSection("infoBasicas")}>
                        {expandedSections.infoBasicas ? (
                            <KeyboardArrowUpIcon />
                        ) : (
                            <KeyboardArrowDownIcon />
                        )}
                    </IconButton>
                </SectionHeader>
                {expandedSections.infoBasicas && (
                    <SectionContent>
                        <InfoBasicasForm
                            formData={formData.infoBasicas}
                            updateFormData={(data) => updateFormData("infoBasicas", data)}
                            errors={errors}
                            resetTrigger={resetTrigger}
                        />
                    </SectionContent>
                )}
            </SectionContainer>

            {/* Seções de Condições Clínicas e Histórico lado a lado */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    gap: 2,
                }}
            >
                {/* Condições Clínicas */}
                <Box sx={{ flex: 1 }}>
                    <SectionContainer>
                        <SectionHeader>
                            <SectionTitle>Condições Clínicas</SectionTitle>
                            <IconButton onClick={() => handleToggleSection("condicoesClinicas")}>
                                {expandedSections.condicoesClinicas ? (
                                    <KeyboardArrowUpIcon />
                                ) : (
                                    <KeyboardArrowDownIcon />
                                )}
                            </IconButton>
                        </SectionHeader>
                        {expandedSections.condicoesClinicas && (
                            <SectionContent>
                                <CondicoesClinicasForm
                                    formData={formData.condicoesClinicas}
                                    updateFormData={(data) => updateFormData("condicoesClinicas", data)}
                                />
                            </SectionContent>
                        )}
                    </SectionContainer>
                </Box>

                {/* Histórico e Primeira Conduta */}
                <Box sx={{ flex: 1 }}>
                    <SectionContainer>
                        <SectionHeader>
                            <SectionTitle>Histórico e Primeira Conduta</SectionTitle>
                            <IconButton onClick={() => handleToggleSection("historicoConduta")}>
                                {expandedSections.historicoConduta ? (
                                    <KeyboardArrowUpIcon />
                                ) : (
                                    <KeyboardArrowDownIcon />
                                )}
                            </IconButton>
                        </SectionHeader>
                        {expandedSections.historicoConduta && (
                            <SectionContent>
                                <ConductHistoryForm
                                    formData={formData.historicoConduta}
                                    updateFormData={(data) => updateFormData("historicoConduta", data)}
                                    doctorId={patientId ? getEffectiveUserId() : null}  // Só passa doctorId se já tiver um paciente (caso de edição)
                                    patientId={patientId}
                                    onFileUpload={async (file) => {
                                        try {
                                            if (!doctorId || !patientId) return; // Ignora upload se não tiver ID de paciente

                                            // Usa a nova função para upload de documentos
                                            await storageService.uploadPatientDocument(
                                                file,
                                                doctorId,
                                                patientId,
                                                {
                                                    category: "Histórico",
                                                    description: "Arquivo anexo ao histórico"
                                                }
                                            );

                                            return true;
                                        } catch (error) {
                                            console.error("Erro ao fazer upload do arquivo de histórico:", error);
                                            throw error;
                                        }
                                    }}
                                />
                            </SectionContent>
                        )}
                    </SectionContainer>
                </Box>
            </Box>

            {/* Botões de ação */}
            <ActionButtonsContainer>
                <ActionButton variant="outlined" disabled={isSubmitting}>
                    Voltar
                </ActionButton>
                <ActionButton variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? "Cadastrando..." : "Confirmar Cadastro"}
                </ActionButton>
            </ActionButtonsContainer>

            {/* Snackbar de feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "top", horizontal: "center" }} // Posição no topo, mais visível
                TransitionComponent={Slide} // Adiciona uma animação de slide
                TransitionProps={{ direction: "down" }} // Slide de cima para baixo
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    elevation={6}
                    sx={{
                        width: "100%",
                        fontSize: "16px",
                        alignItems: "center",
                        borderRadius: 2,
                        boxShadow: 3,
                        // Estilo específico baseado na severidade
                        ...(snackbar.severity === "success" && {
                            backgroundColor: "#1e8e3e",
                            color: "white",
                            "& .MuiAlert-icon": { color: "white" },
                        }),
                        ...(snackbar.severity === "error" && {
                            backgroundColor: "#d93025",
                            color: "white",
                            "& .MuiAlert-icon": { color: "white" },
                        }),
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </PageContainer>
    );
}
