"use client";
import React from "react";
import { Button, Box, Typography } from "@mui/material";

function NovaReceitaButton() {
    return (
        <Button
            variant="contained"
            aria-label="Receita"
            sx={{
                width: "203px",
                textTransform: "none",
                borderRadius: "99px",
                px: "8px",
                py: "10px",
                backgroundColor: "#2971FF",
                color: "#FFF",
                display: "flex",
                alignItems: "center",
                gap: "20px",
            }}
        >
            <Box
                component="img"
                src="/newreceita.svg"
                alt="Ícone de Novo Paciente"
                sx={{
                    width: "22px",
                    height: "22px",
                    objectFit: "contain",
                    flexShrink: 0,
                }}
            />
            <Typography
                sx={{
                    fontFamily: "Gellix",
                    fontSize: "16px",
                    fontWeight: 500,
                    textAlign: "center",
                    flexGrow: 1,
                }}
            >
                Receita
            </Typography>
        </Button>
    );
}

export default NovaReceitaButton;
