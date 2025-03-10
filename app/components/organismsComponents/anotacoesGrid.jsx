"use client";
import React from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    IconButton,
    Grid
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

// Paleta de cores (pode extrair para outro arquivo se quiser)
const themeColors = {
    primary: "#1852FE",
    textPrimary: "#111E5A",
    textSecondary: "#666",
    borderColor: "rgba(0, 0, 0, 0.10)",
};

// Botão para criar nova ficha
function CriarNovaFichaButton() {
    return (
        <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
                height: 46,
                padding: "0 24px",
                borderRadius: "99px",
                backgroundColor: themeColors.primary,
                color: "#FFF",
                fontFamily: "Gellix",
                fontSize: 14,
                fontWeight: 500,
                textTransform: "none",
                "&:hover": {
                    backgroundColor: "#0d47e0",
                },
            }}
        >
            Criar nova ficha
        </Button>
    );
}

// Card de cada anotação
function AnotacoesCard({ nota }) {
    return (
        <Card
            sx={{
                width: "100%",
                borderRadius: "20px",
                border: `1px solid ${themeColors.borderColor}`,
                boxShadow: "0px 8px 24px 0px rgba(0, 0, 0, 0.04)",
                mb: 2,
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", width: "60%" }}>
                        {/* Consulta com bolinha azul */}
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                            <FiberManualRecordIcon sx={{ color: themeColors.primary, fontSize: 8, mr: 1 }} />
                            <Typography
                                variant="caption"
                                sx={{
                                    color: themeColors.textSecondary,
                                    fontFamily: "Gellix",
                                    fontSize: 12,
                                }}
                            >
                                Consulta: {nota.data}
                            </Typography>
                        </Box>

                        {/* Título */}
                        <Typography
                            variant="h6"
                            sx={{
                                color: themeColors.textPrimary,
                                fontFamily: "Gellix",
                                fontSize: 18,
                                fontWeight: 500,
                                mb: 1,
                            }}
                        >
                            {nota.titulo}
                        </Typography>

                        {/* Descrição */}
                        <Typography
                            variant="body2"
                            sx={{
                                color: themeColors.textSecondary,
                                fontFamily: "Gellix",
                                fontSize: 14,
                                mb: 1,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                            }}
                        >
                            {nota.descricao}
                        </Typography>

                        {/* Criado em */}
                        <Typography
                            variant="caption"
                            sx={{
                                color: themeColors.textSecondary,
                                fontFamily: "Gellix",
                                fontSize: 12,
                                mt: "auto",
                            }}
                        >
                            Criado em {nota.criado}
                        </Typography>
                    </Box>

                    {/* Lado direito com botão +2 e anexo PDF */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        {nota.quantidadeAnexos > 0 && (
                            <Box
                                sx={{
                                    backgroundColor: themeColors.primary,
                                    borderRadius: "50%",
                                    width: 32,
                                    height: 32,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#FFF",
                                    fontFamily: "Gellix",
                                    fontSize: 14,
                                    fontWeight: 500,
                                }}
                            >
                                +{nota.quantidadeAnexos}
                            </Box>
                        )}

                        {nota.anexo && (
                            <Box sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                maxWidth: "100px"
                            }}>
                                <Box
                                    sx={{
                                        backgroundColor: "#F5F5F5",
                                        borderRadius: "4px",
                                        p: 1,
                                        display: "flex",
                                        justifyContent: "center",
                                        mb: 0.5,
                                    }}
                                >
                                    <PictureAsPdfIcon sx={{ color: "#E74C3C", fontSize: 24 }} />
                                </Box>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: themeColors.textSecondary,
                                        fontFamily: "Gellix",
                                        fontSize: 12,
                                        textAlign: "center",
                                        width: "100%",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {nota.anexo.nome}
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: themeColors.textSecondary,
                                        fontFamily: "Gellix",
                                        fontSize: 10,
                                    }}
                                >
                                    {nota.anexo.tamanho}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

// Seção de notas
export default function NotasSection({ notas = [] }) {
    // Dados de exemplo para testar
    const notasExemplo = notas.length > 0 ? notas : [
        {
            id: 1,
            titulo: "Lorem Título 1",
            data: "23/11/2024",
            descricao: "Paciente relatou melhora significativa após o início do uso de Dipirona 1g e Paracetamol 750mg conforme prescrição.",
            criado: "24 de Dezembro/2024",
            quantidadeAnexos: 2,
            anexo: {
                nome: "pas-nelio.pdf",
                tamanho: "74mb"
            }
        },
        {
            id: 2,
            titulo: "Lorem Título 2",
            data: "23/11/2024",
            descricao: "Paciente relatou melhora significativa após o início do uso de Dipirona 1g e Paracetamol 750mg conforme prescrição.",
            criado: "24 de Dezembro/2024",
            quantidadeAnexos: 2,
            anexo: {
                nome: "pas-nelio.pdf",
                tamanho: "74mb"
            }
        },
        {
            id: 3,
            titulo: "Lorem Título 3",
            data: "23/11/2024",
            descricao: "Paciente relatou melhora significativa após o início do uso de Dipirona 1g e Paracetamol 750mg conforme prescrição.",
            criado: "24 de Dezembro/2024",
            quantidadeAnexos: 2,
            anexo: {
                nome: "pas-nelio.pdf",
                tamanho: "74mb"
            }
        },
        {
            id: 4,
            titulo: "Lorem Título 4",
            data: "23/11/2024",
            descricao: "Paciente relatou melhora significativa após o início do uso de Dipirona 1g e Paracetamol 750mg conforme prescrição.",
            criado: "24 de Dezembro/2024",
            quantidadeAnexos: 2,
            anexo: {
                nome: "pas-nelio.pdf",
                tamanho: "74mb"
            }
        }
    ];

    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: "1000px",
                display: "flex",
                flexDirection: "column",
                height: "auto",
            }}
        >
            {/* Header: título e botão */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                    width: "100%",
                }}
            >
                <Typography
                    variant="h4"
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix",
                        fontSize: 26,
                        fontWeight: 500,
                    }}
                >
                    Anotações
                </Typography>
                <CriarNovaFichaButton />
            </Box>

            {/* Lista de notas - um card por linha */}
            <Box
                sx={{
                    width: "100%",
                    maxHeight: "300px",
                    overflowY: "auto",
                    paddingRight: 1,
                    // Estilos para a barra de rolagem
                    "&::-webkit-scrollbar": {
                        width: "6px",
                        borderRadius: "3px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "rgba(0,0,0,0.2)",
                        borderRadius: "3px",
                    },
                    "&::-webkit-scrollbar-track": {
                        backgroundColor: "rgba(0,0,0,0.05)",
                        borderRadius: "3px",
                    },
                }}
            >
                {notasExemplo.map((nota) => (
                    <AnotacoesCard key={nota.id} nota={nota} />
                ))}
            </Box>
        </Box>
    );
}