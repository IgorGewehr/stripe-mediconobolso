"use client";
import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Typography, Button } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PacienteCard from "./organismsComponents/cardPaciente";
import AcompanhamentoSection from "./organismsComponents/acompanhamentoSection";
import NotasSection from "./organismsComponents/anotacoesGrid";
import { useAuth } from "./authProvider";
import FirebaseService from "../../lib/FirebaseService";

// Main component
export default function PacienteTemplate({ paciente, pacienteId, onBack }) {
    const { user } = useAuth();
    const [pacienteData, setPacienteData] = useState(null);
    const [notasData, setNotasData] = useState([]);
    const [loading, setLoading] = useState(!!pacienteId); // Se recebemos apenas o ID, começamos carregando
    const [error, setError] = useState(null);

    // Efeito para carregar dados se apenas o ID for fornecido
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

                    // Preparar os dados para o template
                    const processedPatient = {
                        ...patientData,
                        id: pacienteId, // Garantir que o ID esteja presente
                        nome: patientData.patientName,
                        fotoPerfil: patientData.patientPhotoUrl || "",
                        tipoSanguineo: patientData.bloodType || "",
                        dataNascimento: patientData.birthDate || "",
                        contato: {
                            celular: patientData.patientPhone || patientData.phone || "",
                            fixo: patientData.secondaryPhone || "",
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
                    };

                    setPacienteData(processedPatient);

                    // Carregar anotações (opcional)
                    try {
                        // Aqui você pode carregar as anotações do paciente
                        // const anamneses = await FirebaseService.listAnamneses(doctorId, pacienteId);
                        // Formatar as anotações para o componente NotasSection
                        // setNotasData(anamneses.map(...));
                    } catch (err) {
                        console.error("Erro ao carregar anotações:", err);
                    }

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
                flexDirection: "row",
                gap: 2,
                width: "100%",
                backgroundColor: "#F4F9FF",
                p: "10px",
                boxSizing: "border-box",
                position: "relative",
                alignItems: "flex-start", // Importante para alinhamento superior
                height: "auto",
                minHeight: "0",
                overflow: "visible", // Permite que o conteúdo ultrapasse sem scroll
            }}
        >
            <Box
                sx={{
                    position: "relative",
                    flexShrink: 0,
                    zIndex: 2,
                    alignSelf: "flex-start", // Força o card a ficar no topo
                    height: "max-content", // Define altura baseada no conteúdo
                    maxHeight: "none", // Remove limitação de altura máxima
                }}
            >
                <PacienteCard paciente={pacienteData} />
            </Box>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    p: 3,
                    width: "100%",
                    boxSizing: "border-box",
                    alignSelf: "flex-start", // Mantém esse container alinhado com o topo
                    zIndex: 1,
                    height: "auto", // Ajusta altura automaticamente
                    minHeight: "0", // Remove altura mínima
                }}
            >
                {/* Accompaniment Section */}
                <AcompanhamentoSection pacienteId={pacienteId || pacienteData.id} />

                {/* Notes Section */}
                <NotasSection notas={notasData.length > 0 ? notasData : undefined} pacienteId={pacienteId || pacienteData.id} />
            </Box>
        </Box>
    );
}