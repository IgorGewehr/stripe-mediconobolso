"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import CriarNovaFichaButton from "./basicComponents/criarNovaFichaButton";
import AnotacoesCard from "./basicComponents/anotacoesCard";

// O componente recebe uma lista de notas por props
const AnotacoesGrid = ({ notas = [] }) => {
    return (
        <Box
            sx={{
                width: "1110px",
                // Tenta usar fundo transparente; se não, fallback para #D8E8FF
                background: "transparent", // se necessário, substitua por "#D8E8FF"
                boxSizing: "border-box",
            }}
        >
            {/* Header do grid: título e botão */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    position: "relative",
                }}
            >
                <Typography
                    sx={{
                        color: "#111E5A",
                        fontFamily: "Gellix",
                        fontSize: "30px",
                        fontStyle: "normal",
                        fontWeight: 500,
                        lineHeight: "normal",
                        mt: "28px", // 28px abaixo do topo do grid
                    }}
                >
                    Anotações
                </Typography>
                {/* O botão inicia colado ao topo */}
                <Box>
                    <CriarNovaFichaButton />
                </Box>
            </Box>

            {/* Espaçamento de 37px abaixo do header */}
            <Box sx={{ mt: "37px" }}>
                {/* Grid de notas */}
                <Box
                    sx={{
                        display: "grid",
                        gap: "20px",
                        // Aqui definimos um grid responsivo; ajuste o minmax conforme o tamanho médio do card
                        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    }}
                >
                    {notas.map((nota, index) => (
                        <AnotacoesCard key={index} nota={nota} />
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

export default AnotacoesGrid;
