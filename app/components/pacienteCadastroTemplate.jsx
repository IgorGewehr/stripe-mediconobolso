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
} from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import InfoBasicasForm from "./organismsComponents/informacoesBasicas";
import CondicoesClinicasForm from "./organismsComponents/condicoesClinicas";
import HistoricoCondutaForm from "./organismsComponents/historicoConduta";

// ------------------ ESTILOS ------------------
const PageContainer = styled(Box)(({ theme }) => ({
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
    // Cada seção terá um espaço externo
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
            backgroundColor: "#111E5A",
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

// -------------------------------------------------

export default function PacienteCadastroTemplate() {
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

    // Estado para feedback (Snackbar)
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success", // ou "error"
    });

    // Estado para controle de loading ao submeter
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        // Validar informações básicas
        if (!formData.infoBasicas.nome) {
            newErrors.nome = "Nome completo é obrigatório";
        }

        if (!formData.infoBasicas.dataNascimento) {
            newErrors.dataNascimento = "Data de nascimento é obrigatória";
        }

        if (!formData.infoBasicas.email) {
            newErrors.email = "Email é obrigatório";
        } else if (!/\S+@\S+\.\S+/.test(formData.infoBasicas.email)) {
            newErrors.email = "Email inválido";
        }

        if (!formData.infoBasicas.telefone) {
            newErrors.telefone = "Telefone é obrigatório";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit
    const handleSubmit = async () => {
        if (!validateForm()) {
            setSnackbar({
                open: true,
                message: "Por favor, corrija os erros antes de enviar.",
                severity: "error",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Simulando uma chamada de API
            await new Promise((resolve) => setTimeout(resolve, 1000));

            console.log("Dados enviados:", formData);

            setSnackbar({
                open: true,
                message: "Paciente cadastrado com sucesso!",
                severity: "success",
            });
            // Ex: router.push("/pacientes");
        } catch (error) {
            console.error("Erro ao cadastrar paciente:", error);
            setSnackbar({
                open: true,
                message: "Erro ao cadastrar paciente. Tente novamente.",
                severity: "error",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fechar snackbar
    const handleCloseSnackbar = () => {
        setSnackbar((prev) => ({ ...prev, open: false }));
    };

    return (
        <PageContainer>
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
                        />
                    </SectionContent>
                )}
            </SectionContainer>

            {/* Seções de Condições Clínicas e Histórico lado a lado */}
            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
                {/* Seção de Condições Clínicas */}
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

                {/* Seção de Histórico e Primeira Conduta */}
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
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </PageContainer>
    );
}
