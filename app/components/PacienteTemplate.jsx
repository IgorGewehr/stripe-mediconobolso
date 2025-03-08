"use client";
import React from "react";
import { Box } from "@mui/material";
import CardPaciente from "./organismsComponents/cardPaciente";
import AcompanhamentoSection from "./organismsComponents/acompanhamentoSection";
import AnotacoesGrid from "./organismsComponents/anotacoesGrid";

const PacienteTemplate = () => {
    return (
        <Box
            sx={{
                background: "#D8E8FF",
                width: "100%",
                minHeight: "100vh",
                padding: "40px",
                boxSizing: "border-box",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    gap: "60px",
                    position: "relative",
                }}
            >
                {/* Coluna esquerda: CardPaciente */}
                <Box
                    sx={{
                        position: "relative",
                        width: "380px", // largura do CardPaciente retratado
                        flexShrink: 0,
                    }}
                >
                    {/* CardPaciente posicionado absolutamente para sobrepor o conteúdo da direita quando expandir */}
                    <Box sx={{ position: "absolute", top: 0, left: 0, zIndex: 2 }}>
                        <CardPaciente />
                    </Box>
                    {/* Espaço reservado para manter o layout (altura do CardPaciente retratado) */}
                    <Box sx={{ height: "817px" }} />
                </Box>
                {/* Coluna direita: AcompanhamentoSection no topo e AnotacoesGrid abaixo */}
                <Box
                    sx={{
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: "20px",
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    <AcompanhamentoSection />
                    <AnotacoesGrid />
                </Box>
            </Box>
        </Box>
    );
};

export default PacienteTemplate;
