"use client";
import React from "react";
import { Button, Box, Typography } from "@mui/material";

const ImportFichaButton = () => {
    return (
        <Button
            variant="outlined"
            aria-label="Importar Ficha"
            sx={{
                display: "flex",
                width: "182px",
                height: "52px",
                padding: "18px 17px",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
                flexShrink: 0,
                borderRadius: "99px",
                border: "1px solid #111E5A",
                textTransform: "none",
            }}
        >
            <Box
                component="img"
                src="/importficha.svg"
                alt="Ícone Importar Ficha"
                sx={{
                    width: "16px",
                    height: "16px",
                    objectFit: "contain",
                    flexShrink: 0,
                }}
            />
            <Typography
                sx={{
                    color: "#111E5A",
                    fontFamily: "Gellix",
                    fontSize: "16px",
                    fontWeight: 500,
                    lineHeight: "normal",
                }}
            >
                Importar Ficha
            </Typography>
        </Button>
    );
};

export default ImportFichaButton;
