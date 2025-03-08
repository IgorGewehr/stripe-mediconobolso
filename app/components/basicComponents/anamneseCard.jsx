"use client";
import React from "react";
import { Box, Typography } from "@mui/material";

const AnamneseCard = () => {
    return (
        <Box
            sx={{
                width: "270px",
                height: "240px",
                borderRadius: "30px",
                border: "1px solid #EAECEF",
                backgroundColor: "#FFF",
                position: "relative",
                flexShrink: 0,
                padding: "21px 24px 18px 24px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "space-between",
            }}
        >
            {/* Imagem Principal */}
            <Box
                component="img"
                src="/anamnesecard.svg"
                alt="Anamnese"
                sx={{
                    width: "108.39px",
                    height: "150px",
                    flexShrink: 0,
                    marginBottom: "18px",
                }}
            />

            {/* Título */}
            <Box
                sx={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Typography
                    sx={{
                        color: "#111E5A",
                        fontFamily: "Gellix",
                        fontSize: "25px",
                        fontStyle: "normal",
                        fontWeight: 500,
                        lineHeight: "42.703px",
                    }}
                >
                    Anamnese
                </Typography>

                {/* Botão Circular com Ícone */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36.43px",
                        height: "36.43px",
                        borderRadius: "18.215px",
                        backgroundColor: "#1852FE",
                        padding: "9.107px",
                        flexShrink: 0,
                    }}
                >
                    <Box
                        component="img"
                        src="/plusicon.svg"
                        alt="Adicionar"
                        sx={{
                            width: "18.215px",
                            height: "18.215px",
                            flexShrink: 0,
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default AnamneseCard;
