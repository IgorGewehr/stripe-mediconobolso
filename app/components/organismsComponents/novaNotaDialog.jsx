"use client";
import React from "react";
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    Button,
    IconButton,
} from "@mui/material";

const NovaNotaDialog = ({ open, onClose }) => {
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
                    overflow: "hidden",
                    position: "relative",
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
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    position: "relative",
                    height: "100%",
                }}
            >
                {/* Botão de Voltar (Esquerda Superior) */}
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

                {/* Ícone Centralizado (newnote.svg) */}
                <Box
                    component="img"
                    src="/newnote.svg"
                    alt="Criar Nota"
                    sx={{
                        width: "37.398px",
                        height: "41.553px",
                        marginTop: "77px",
                    }}
                />

                {/* Título Centralizado */}
                <Typography
                    sx={{
                        marginTop: "13px",
                        color: "#111E5A",
                        fontFamily: "Gellix",
                        fontSize: "45.537px",
                        fontWeight: 500,
                    }}
                >
                    Criar nova nota
                </Typography>

                {/* Botões de Seleção */}
                <Box
                    sx={{
                        marginTop: "32.52px",
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                    }}
                >
                    {/* Botão Nota Rápida */}
                    <Button
                        variant="outlined"
                        sx={{
                            display: "flex",
                            width: "269.809px",
                            height: "63.752px",
                            padding: "20.492px 19.353px",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderRadius: "112.705px",
                            border: "1.138px solid #1852FE",
                            background: "#FFF",
                            textTransform: "none",
                            color: "#111E5A",
                            fontFamily: "Gellix",
                            fontSize: "18.215px",
                            fontWeight: 500,
                        }}
                    >
                        <Typography>Nota Rápida</Typography>
                        <Box
                            component="img"
                            src="/plusicon.svg"
                            alt="Adicionar"
                            sx={{ width: "18.215px", height: "18.215px" }}
                        />
                    </Button>

                    {/* Texto "ou" Centralizado */}
                    <Typography
                        sx={{
                            color: "#8B97A6",
                            fontFamily: "Gellix",
                            fontSize: "18.215px",
                            fontWeight: 500,
                        }}
                    >
                        ou
                    </Typography>

                    {/* Botão Escolha a Consulta */}
                    <Button
                        variant="outlined"
                        sx={{
                            display: "flex",
                            width: "269.809px",
                            height: "63.752px",
                            padding: "20.492px 19.353px",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderRadius: "112.705px",
                            border: "1.138px solid #EAECEF",
                            background: "#FFF",
                            textTransform: "none",
                            color: "#111E5A",
                            fontFamily: "Gellix",
                            fontSize: "18.215px",
                            fontWeight: 500,
                        }}
                    >
                        <Typography>Escolha a consulta</Typography>
                        <Box
                            component="img"
                            src="/setabaixo.svg"
                            alt="Escolher Consulta"
                            sx={{ width: "18.215px", height: "18.215px" }}
                        />
                    </Button>
                </Box>

                {/* Container Branco Vazio */}
                <Box
                    sx={{
                        marginTop: "66px",
                        width: "1191px",
                        height: "471px",
                        borderRadius: "50px",
                        border: "1px solid #E0E0E0",
                        background: "#FFF",
                    }}
                />
            </DialogContent>
        </Dialog>
    );
};

export default NovaNotaDialog;
