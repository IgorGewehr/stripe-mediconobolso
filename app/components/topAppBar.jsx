"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import NovaReceitaButton from "./basicComponents/novaReceitaButton";
import NovoAgendamentoButton from "./basicComponents/novoAgendamentoButton";
import NovoPacienteButton from "./basicComponents/novoPacienteButton";
import ImportFichaButton from "./basicComponents/importFichaButton";

;

const TopAppBar = ({ label = "Texto...", tela }) => {
    return (
        <Box
            sx={{
                height: "125px",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxSizing: "border-box",
            }}
        >
            {/* Label à esquerda com 58px de margem */}
            <Typography
                sx={{
                    color: "#111E5A",
                    fontFamily: "Gellix",
                    fontSize: "40px",
                    fontStyle: "normal",
                    fontWeight: 400,
                    lineHeight: "normal",
                    ml: "58px",
                }}
            >
                {label}
            </Typography>

            {/* Grupo de botões à direita com 10px de distância entre cada e 48px de margem à direita */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    mr: "48px",
                }}
            >
                {tela === "normal" ? (
                    <>
                        <NovaReceitaButton />
                        <NovoPacienteButton />
                        <NovoAgendamentoButton />
                    </>
                ) : (
                    <ImportFichaButton />
                )}
            </Box>
        </Box>
    );
};

export default TopAppBar;
