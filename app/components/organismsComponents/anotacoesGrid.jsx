"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import CriarNovaFichaButton from "../basicComponents/criarNovaFichaButton";
import AnotacoesCard from "../basicComponents/anotacoesCard";

// O componente recebe uma lista de notas por props
const AnotacoesGrid = ({ notas = [] }) => {
    return (
        <Box
            sx={{
                width: "1110px",
                // Fundo transparente, ou "#D8E8FF" se preferir
                background: "transparent",
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
                {/* Grid de notas com scroll vertical se houver mais de 4 linhas */}
                <Box
                    sx={{
                        display: "grid",
                        gap: "20px",
                        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                        // Estimando altura máxima para 4 linhas de cards:
                        // Por exemplo, se o card tem altura máxima de 101px e gap de 20px entre linhas:
                        // total = 4*101 + 3*20 = 404 + 60 = 464px.
                        maxHeight: "464px",
                        overflowY: "auto",
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
