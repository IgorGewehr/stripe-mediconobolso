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
import InfoBasicasForm from "./organismsComponents/informacoesBasicas";
import CondicoesClinicasForm from "./organismsComponents/condicoesClinicas";
import HistoricoCondutaForm from "./organismsComponents/historicoConduta";

// Importa o serviço do Firebase
import firebaseService from "../../lib/firebaseService";
import { collection, doc, setDoc } from "firebase/firestore";

// Importa o AuthProvider (useAuth) para obter o id do usuário autenticado
import { useAuth } from "./authProvider";

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
    position: "fixed", // Muda de absolute para fixed
    top: 0,
    left: 0,
    width: "100vw", // Usa viewport width para garantir cobertura total
    height: "100vh", // Usa viewport height para garantir cobertura total
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1500, // Aumenta o z-index para garantir que fique acima de tudo
}));

export default function PacienteCadastroTemplate() {
    // Obtenha o id do usuário (doctorId) a partir do AuthProvider
    const { user } = useAuth();

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
            arquivoAnexo: null,
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
                arquivoAnexo: null,
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

        if (!formData.infoBasicas.nome) {
            newErrors.nome = "Nome completo é obrigatório";
        }
        if (!formData.infoBasicas.dataNascimento) {
            newErrors.dataNascimento = "Data de nascimento é obrigatória";
        }
        if (!/\S+@\S+\.\S+/.test(formData.infoBasicas.email)) {
            newErrors.email = "Email inválido";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Função de submit
    const handleSubmit = async () => {
        if (!validateForm()) {
            setSnackbar({
                open: true,
                message: "Por favor, corrija os erros antes de enviar.",
                severity: "error",
            });
            return;
        }

        if (!user || !user.uid) {
            setSnackbar({
                open: true,
                message: "Usuário não autenticado.",
                severity: "error",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const doctorId = user.uid;

            // Gere o docRef para o paciente e obtenha seu ID
            const patientRef = doc(
                collection(firebaseService.firestore, "users", doctorId, "patients")
            );
            const patientId = patientRef.id;

            // Mapeie os campos dos três formulários para o modelo de paciente
            const newPatient = {
                id: patientId,
                patientName: formData.infoBasicas.nome,
                birthDate: formData.infoBasicas.dataNascimento,
                bloodType: formData.infoBasicas.tipoSanguineo,
                gender: formData.infoBasicas.genero,
                address: formData.infoBasicas.endereco,
                city: formData.infoBasicas.cidade,
                state: formData.infoBasicas.estado,
                cpf: formData.infoBasicas.cpf,
                email: formData.infoBasicas.email,
                phone: formData.infoBasicas.telefone,
                cep: formData.infoBasicas.cep,
                doctorId: doctorId,
                createdAt: new Date(),
                // Campos adicionais:
                condicoesClinicas: formData.condicoesClinicas,
                historicoConduta: {
                    doencasHereditarias: formData.historicoConduta.doencasHereditarias,
                    condutaInicial: formData.historicoConduta.condutaInicial,
                },
            };

            // Upload de foto e arquivos
            if (formData.infoBasicas.patientPhoto) {
                const photoPath = `users/${doctorId}/patients/${patientId}/photo_${formData.infoBasicas.patientPhoto.name}`;
                const photoUrl = await firebaseService.uploadFile(
                    formData.infoBasicas.patientPhoto,
                    photoPath
                );
                newPatient.patientPhotoUrl = photoUrl;
            }

            if (formData.historicoConduta.arquivoAnexo) {
                const file = formData.historicoConduta.arquivoAnexo;
                const historyPath = `users/${doctorId}/patients/${patientId}/historico_${file.name}`;
                const historyFileUrl = await firebaseService.uploadFile(file, historyPath);
                newPatient.historicoConduta.arquivoUrl = historyFileUrl;
            }

            // Salva o paciente com todos os dados combinados
            await setDoc(patientRef, newPatient);

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
                                <HistoricoCondutaForm
                                    formData={formData.historicoConduta}
                                    updateFormData={(data) => updateFormData("historicoConduta", data)}
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
