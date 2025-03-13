"use client";
import React from "react";
import { Box } from "@mui/material";
import PacienteCard from "./organismsComponents/cardPaciente";
import AcompanhamentoSection from "./organismsComponents/acompanhamentoSection";
import NotasSection from "./organismsComponents/anotacoesGrid";

// Example data
const exemploPaciente = {
    nome: "Nélio Alves da Silva",
    fotoPerfil: "",
    tipoSanguineo: "O+",
    dataNascimento: "09/02/1989",
    contato: {
        celular: "(048) 9999-9999",
        fixo: "(048) 999-999",
        email: "nelioalves1@gmail.com",
    },
    chronicDiseases: ["Fumante", "Obeso", "Hipertenso"],
    endereco: {
        rua: "Rua das Palmeiras",
        numero: "123",
        bairro: "Centro",
        cidade: "São Paulo",
        estado: "SP",
        cep: "01234-567"
    },
    cirurgias: ["Cirurgia A", "Cirurgia B"],
    alergias: ["Penicilina"],
    atividadeFisica: ["Caminhada", "Natação"],
    historicoMedico: "Nenhuma informação cadastrada",
};

const exemploAnotacoes = [
    {
        id: 1,
        titulo: "Lorem Título 1",
        data: "23/11/2024",
        criado: "24 de Dezembro/2024",
        descricao:
            "Paciente relatou melhora significativa após o início do uso de Dipirona 1g e Paracetamol 750mg",
        anexo: {
            nome: "pas-nelio.pdf",
            tipo: "PDF",
        },
    },
    {
        id: 2,
        titulo: "Lorem Título 2",
        data: "23/11/2024",
        criado: "24 de Dezembro/2024",
        descricao:
            "Paciente relatou melhora significativa após o início do uso de Dipirona 1g e Paracetamol 750mg",
        anexo: {
            nome: "pas-nelio.pdf",
            tipo: "PDF",
        },
    },
    {
        id: 3,
        titulo: "Lorem Título 3",
        data: "23/11/2024",
        criado: "24 de Dezembro/2024",
        descricao:
            "Paciente relatou melhora significativa após o início do uso de Dipirona 1g e Paracetamol 750mg",
        anexo: {
            nome: "pas-nelio.pdf",
            tipo: "PDF",
        },
    },
    {
        id: 4,
        titulo: "Lorem Título 4",
        data: "23/11/2024",
        criado: "24 de Dezembro/2024",
        descricao:
            "Paciente relatou melhora significativa após o início do uso de Dipirona 1g e Paracetamol 750mg",
        anexo: {
            nome: "pas-nelio.pdf",
            tipo: "PDF",
        },
    },
];

// Main component
export default function PacienteTemplate() {
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
                <PacienteCard paciente={exemploPaciente} />
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
                <AcompanhamentoSection />

                {/* Notes Section */}
                <NotasSection notas={exemploAnotacoes} />
            </Box>
        </Box>
    );}
