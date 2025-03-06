"use client";
import React from "react";
import { Button, Box, Typography } from "@mui/material";

function NovoPacienteButton() {
    return (
        <Button
            variant="contained"
            aria-label="Paciente"
            sx={{
                width: "203px",
                textTransform: "none",
                borderRadius: "99px",
                px: "8px",
                py: "10px",
                backgroundColor: "#4C515C",
                color: "#FFF",
                display: "flex",
                alignItems: "center",
                gap: "20px",
            }}
        >
            <Box
                component="img"
                src="/newpaciente.svg"
                alt="Ícone de Novo Paciente"
                sx={{
                    width: "20px",
                    height: "20px",
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
                Paciente
            </Typography>
        </Button>
    );
}

export default NovoPacienteButton;
