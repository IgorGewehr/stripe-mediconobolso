"use client";

import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import PacienteTemplate from "../components/pacienteTemplate";
import { useRouter, useParams } from "next/navigation";
import FirebaseService from "../../lib/firebaseService";
import {useAuth} from "./authProvider";

export default function PerfilPaciente() {
    const router = useRouter();
    const params = useParams();
    const { user } = useAuth();
    const [paciente, setPaciente] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const patientId = params?.id;

    useEffect(() => {
        // Verificar se temos o ID do paciente e o usuário logado
        if (!patientId) {
            router.push('/dashboard');
            return;
        }

        if (!user || !user.uid) {
            // Esperaremos o auth provider terminar de carregar
            return;
        }

        const fetchPatientData = async () => {
            try {
                setLoading(true);
                const doctorId = user.uid;
                const patientData = await FirebaseService.getPatient(doctorId, patientId);

                if (!patientData) {
                    setError("Paciente não encontrado");
                    return;
                }

                // Preparar os dados para o template
                const processedPatient = {
                    ...patientData,
                    nome: patientData.patientName,
                    fotoPerfil: patientData.patientPhotoUrl || "",
                    tipoSanguineo: patientData.bloodType || "",
                    dataNascimento: patientData.birthDate || "",
                    contato: {
                        celular: patientData.phone || "",
                        fixo: patientData.secondaryPhone || "",
                        email: patientData.email || "",
                    },
                    chronicDiseases: patientData.condicoesClinicas?.doencas || [],
                    endereco: {
                        rua: patientData.address || "",
                        numero: "",
                        bairro: "",
                        cidade: patientData.city || "",
                        estado: patientData.state || "",
                        cep: patientData.cep || ""
                    },
                    cirurgias: patientData.condicoesClinicas?.cirurgias || [],
                    alergias: patientData.condicoesClinicas?.alergias || [],
                    atividadeFisica: patientData.condicoesClinicas?.atividades || [],
                    historicoMedico: patientData.historicoConduta?.doencasHereditarias || "Nenhuma informação cadastrada",
                };

                setPaciente(processedPatient);
            } catch (err) {
                console.error("Erro ao carregar dados do paciente:", err);
                setError("Não foi possível carregar os dados do paciente.");
            } finally {
                setLoading(false);
            }
        };

        fetchPatientData();
    }, [patientId, user, router]);

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
            </Box>
        );
    }

    // Renderizar o template com os dados do paciente
    return (
        <Box sx={{ width: '100%', height: '100%' }}>
            {paciente && <PacienteTemplate paciente={paciente} />}
        </Box>
    );
}