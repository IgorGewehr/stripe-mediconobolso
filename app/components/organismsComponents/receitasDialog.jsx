"use client";
import React from "react";
import { Dialog, DialogContent, Box, Typography, IconButton } from "@mui/material";
import CriarNovaReceitaButton from "../basicComponents/criarNovaReceitaButton";


const ReceitasDialog = ({ open, onClose }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            PaperProps={{
                sx: {
                    width: "1338px",
                    height: "882px",
                    borderRadius: "50px",
                    border: "1px solid #EAECEF",
                    background: "#FFF",
                    boxShadow: "0px 4px 10px 0px rgba(0, 0, 0, 0.07)",
                    position: "relative",
                    overflow: "hidden",
                },
            }}
            BackdropProps={{
                sx: {
                    backdropFilter: "blur(4px)",
                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                },
            }}
        >
            <DialogContent
                sx={{
                    padding: 0,
                    position: "relative",
                    height: "100%",
                }}
            >
                {/* Botão de Voltar no canto superior esquerdo */}
                <IconButton
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        top: "34px",
                        left: "36px",
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        background: "#FFF",
                        border: "1.5px solid #CED4DA",
                    }}
                >
                    <Box
                        component="img"
                        src="/leftarrow.svg"
                        alt="Voltar"
                        sx={{ width: "30px", height: "30px" }}
                    />
                </IconButton>

                {/* Botão Criar Nova Receita no canto superior direito */}
                <Box
                    sx={{
                        position: "absolute",
                        top: "30px",
                        right: "30px",
                    }}
                >
                    <CriarNovaReceitaButton />
                </Box>

                {/* Ícone Receita centralizado horizontalmente, 42px do topo */}
                <Box
                    sx={{
                        position: "absolute",
                        top: "42px",
                        left: "50%",
                        transform: "translateX(-50%)",
                    }}
                >
                    <Box
                        component="img"
                        src="/receitaicon.svg"
                        alt="Receitas"
                        sx={{ width: "88.391px", height: "139.179px" }}
                    />
                    {/* Título "Receitas", 5px abaixo do ícone */}
                    <Typography
                        sx={{
                            mt: "5px",
                            textAlign: "center",
                            color: "#111E5A",
                            fontFamily: "Gellix",
                            fontSize: "45.537px",
                            fontWeight: 500,
                        }}
                    >
                        Receitas
                    </Typography>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default ReceitasDialog;
