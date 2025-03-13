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
    endereco: "Rua das Palmeiras, 123",
    cidade: "São Paulo",
    cep: "01234-567",
    cirurgias: ["Cirurgia A", "Cirurgia B"],
    alergias: ["Penicilina"],
    atividadeFisica: ["Caminhada", "Natação"],
    historicoDoencasGeneticas: "Nenhuma informação cadastrada",
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
                pb: "30px",
                overflowY: "visible", // Alterado de "auto" para "visible"
                height: "auto", // Alterado de maxHeight para height: auto
                backgroundColor: "#F4F9FF",
                p: "10px",
                boxSizing: "border-box",
                position: "relative", // Important for z-index stacking
            }}
        >
            <Box
                sx={{
                    position: "relative", // Needed for proper z-index stacking
                    flexShrink: 0,
                    zIndex: 2, // Ensuring patient card stays above other content if needed
                }}
            >
                <PacienteCard paciente={exemploPaciente} />
            </Box>

            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    p: 4,
                    width: "100%",
                    boxSizing: "border-box",
                    height: "auto", // Alterado de maxHeight para height: auto
                    zIndex: 1, // Lower z-index than the patient card
                }}
            >
                {/* Accompaniment Section */}
                <AcompanhamentoSection />

                {/* Notes Section */}
                <NotasSection notas={exemploAnotacoes} />
            </Box>
        </Box>
    );
}