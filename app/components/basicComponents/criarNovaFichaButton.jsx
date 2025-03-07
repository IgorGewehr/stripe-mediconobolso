"use client";
import React from "react";
import { Button, Box, Typography } from "@mui/material";

const CriarNovaFichaButton = () => {
    return (
        <Button
            variant="contained"
            sx={{
                width: "213px",
                height: "64px",
                borderRadius: "50px",
                background: "#1852FE",
                color: "#FFF",
                display: "flex",
                alignItems: "center",
                gap: "16.57px",
                padding: "0 16px",
                textTransform: "none",
                justifyContent: "space-between",
            }}
        >
            {/* Texto do botão */}
            <Typography
                sx={{
                    color: "#FFF",
                    fontFamily: "Gellix",
                    fontSize: "16px",
                    fontWeight: 500,
                    lineHeight: "normal",
                }}
            >
                Criar nova ficha
            </Typography>

            {/* Ícone Plus no lado direito */}
            <Box
                sx={{
                    display: "flex",
                    width: "36.43px",
                    height: "36.43px",
                    padding: "9.107px",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    flexShrink: 0,
                }}
            >
                <Box
                    component="img"
                    src="/plusicoblue.svg"
                    alt="Adicionar"
                    sx={{
                        width: "18.215px",
                        height: "18.215px",
                        flexShrink: 0,
                    }}
                />
            </Box>
        </Button>
    );
};

export default CriarNovaFichaButton;
