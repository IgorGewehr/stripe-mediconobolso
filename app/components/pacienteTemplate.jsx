"use client";
import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Typography, Button, useTheme, useMediaQuery } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PacienteCard from "./organismsComponents/cardPaciente";
import AcompanhamentoSection from "./organismsComponents/acompanhamentoSection";
import NotasSection from "./organismsComponents/notasSection";
import { useAuth } from "./authProvider";
import FirebaseService from "../../lib/firebaseService";

// Main component
export default function PacienteTemplate({ paciente, pacienteId, onBack }) {
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const isMedium = useMediaQuery(theme.breakpoints.down('md'));
    
    const [pacienteData, setPacienteData] = useState(null);
    const [notasData, setNotasData] = useState([]);
    const [loading, setLoading] = useState(!!pacienteId);
    const [error, setError] = useState(null);
    const [notasUpdated, setNotasUpdated] = useState(false); // Estado para controlar atualizações

    const doctorId = user.uid;

    const forceUpdateNotas = async () => {
        console.log("Forçando atualização de notas...");
        try {
            const notes = await FirebaseService.listNotes(user.uid, pacienteId);
            // Ordena as notas por data (mais recentes primeiro)
            const sortedNotes = notes.sort((a, b) => {
                const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
                const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
                return dateB - dateA;
            });

            setNotasData(sortedNotes);
            return sortedNotes;
        } catch (err) {
            console.error("Erro ao carregar anotações:", err);
            return [];
        }
    };

    // Função para buscar notas
    const fetchNotas = async () => {
        if (pacienteId && user?.uid) {
            try {
                const notes = await FirebaseService.listNotes(user.uid, pacienteId);
                setNotasData(notes);
            } catch (err) {
                console.error("Erro ao carregar anotações:", err);
            }
        }
    };

    // Efeito para carregar dados - versão corrigida
    useEffect(() => {
        // Se já temos os dados completos do paciente, não precisamos carregar
        if (paciente) {
            setPacienteData(paciente);
            return;
        }

        // Se temos apenas o ID, precisamos buscar os dados
        if (pacienteId && user?.uid) {
            const fetchPacienteData = async () => {
                try {
                    setLoading(true);
                    const doctorId = user.uid;
                    const patientData = await FirebaseService.getPatient(doctorId, pacienteId);

                    if (!patientData) {
                        setError("Paciente não encontrado");
                        return;
                    }

                    // Preparar os dados para o template - garantir que todos os dados estão sendo preservados
                    const processedPatient = {
                        ...patientData, // Manter todos os campos originais
                        id: pacienteId, // Garantir que o ID esteja presente
                        nome: patientData.patientName || patientData.nome || "",
                        fotoPerfil: patientData.patientPhotoUrl || "",
                        tipoSanguineo: patientData.bloodType || "",
                        dataNascimento: patientData.birthDate || "",
                        contato: {
                            celular: patientData.patientPhone || patientData.phone || "",
                            fixo: patientData.secondaryPhone || "",
                            adicional: patientData.contatoAdicional || "",
                            email: patientData.patientEmail || patientData.email || "",
                        },
                        chronicDiseases: patientData.chronicDiseases || [],
                        endereco: {
                            rua: patientData.patientAddress || patientData.address || "",
                            numero: "",
                            bairro: "",
                            cidade: patientData.city || "",
                            estado: patientData.state || "",
                            cep: patientData.cep || ""
                        },
                        cirurgias: patientData.condicoesClinicas?.cirurgias || [],
                        alergias: patientData.allergies || patientData.condicoesClinicas?.alergias || [],
                        atividadeFisica: patientData.condicoesClinicas?.atividades || [],
                        historicoMedico: patientData.historicoConduta?.doencasHereditarias || "Nenhuma informação cadastrada",
                        // Garantir que healthPlans e statusList estão presentes
                        healthPlans: patientData.healthPlans || [],
                        healthPlan: patientData.healthPlan || {},
                        statusList: patientData.statusList || []
                    };

                    setPacienteData(processedPatient);

                    // Carregar anotações
                    fetchNotas();

                } catch (err) {
                    console.error("Erro ao carregar dados do paciente:", err);
                    setError("Não foi possível carregar os dados do paciente.");
                } finally {
                    setLoading(false);
                }
            };

            fetchPacienteData();
        }
    }, [pacienteId, paciente, user]);

    // Efeito para atualizar notas quando houver mudanças
    useEffect(() => {
        if (notasUpdated) {
            fetchNotas();
            setNotasUpdated(false);
        }
    }, [notasUpdated]);

    // Handler para atualização de notas
    const handleNotaUpdated = () => {
        setNotasUpdated(true);

        // Use um setTimeout para garantir que a atualização aconteça após completar outras operações
        setTimeout(() => {
            fetchNotas();
        }, 500);
    };



    // Função para voltar à lista de pacientes
    const handleBack = () => {
        if (onBack) {
            onBack();
        }
    };

    // Mostrar loading enquanto carrega
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    // Mostrar mensagem de erro
    if (error) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="error">{error}</Typography>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={handleBack}
                    sx={{ mt: 2 }}
                >
                    Voltar
                </Button>
            </Box>
        );
    }

    // Se não temos dados do paciente ainda, não renderiza
    if (!pacienteData) {
        return null;
    }

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: isMedium ? "column" : "row",
                gap: isMobile ? 1.5 : isTablet ? 2 : 3,
                width: "100%",
                backgroundColor: "#F4F9FF",
                p: isMobile ? 1 : isTablet ? 2 : 3,
                boxSizing: "border-box",
                position: "relative",
                alignItems: isMedium ? "stretch" : "flex-start",
                height: "auto",
                minHeight: isMobile ? "100vh" : "auto",
                overflow: "visible",
            }}
        >
            <Box
                sx={{
                    position: "relative",
                    flexShrink: 0,
                    zIndex: 2,
                    alignSelf: isMedium ? "stretch" : "flex-start",
                    height: "max-content",
                    maxHeight: "none",
                    width: isMedium ? "100%" : "380px",
                    maxWidth: isMedium ? "none" : "380px",
                    mb: isMedium ? 2 : 0,
                }}
            >
                <PacienteCard paciente={pacienteData} />
            </Box>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: isMobile ? 2 : isTablet ? 2.5 : 3,
                    p: isMobile ? 1.5 : isTablet ? 2 : 3,
                    width: "100%",
                    boxSizing: "border-box",
                    alignSelf: "flex-start",
                    zIndex: 1,
                    height: "auto",
                    minHeight: "0",
                    marginLeft: "0px",
                    flex: 1,
                }}
            >
                {/* Passa a função de atualização para AcompanhamentoSection */}
                <AcompanhamentoSection
                    pacienteId={pacienteId || pacienteData.id}
                    doctorId={doctorId}
                    onNotaUpdated={handleNotaUpdated}
                    forceUpdateNotas={forceUpdateNotas}
                />

                {/* Passa as notas atualizadas e função de atualização para NotasSection */}
                <NotasSection
                    notas={notasData}
                    pacienteId={pacienteId || pacienteData.id}
                    onNotaUpdated={handleNotaUpdated}
                />
            </Box>
        </Box>
    );
}
