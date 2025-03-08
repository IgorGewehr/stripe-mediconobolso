"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import ReceitasCard from "../basicComponents/receitasCard";
import ExamesCard from "../basicComponents/examesCard";
import AnamneseCard from "../basicComponents/anamneseCard";

const AcompanhamentoSection = () => {
    return (
        <Box
            sx={{
                width: "894px",
                height: "360px",
                background: "transparent", // ou, se preferir, "#D8E8FF"
                boxSizing: "border-box",
            }}
        >
            {/* Título no topo esquerdo */}
            <Typography
                sx={{
                    color: "#111E5A",
                    fontFamily: "Gellix",
                    fontSize: "30px",
                    fontStyle: "normal",
                    fontWeight: 500,
                    lineHeight: "normal",
                }}
            >
                Acompanhamento
            </Typography>

            {/* Linha de botões a 27px abaixo do título, com 33px de gap entre eles */}
            <Box sx={{ mt: "27px", display: "flex", gap: "33px" }}>
                <AnamneseCard />
                <ReceitasCard />
                <ExamesCard />
            </Box>
        </Box>
    );
};

export default AcompanhamentoSection;
