"use client";
import React from "react";
import { Box, Typography } from "@mui/material";

// Exemplo de objeto nota (para referência)
// const nota = {
//   dataConsulta: "Consulta: 12/08/24",            // opcional
//   dataCriacao: "Criado em 24 de dezembro de 2024", // opcional
//   tituloNota: "Título muito longo da nota que pode ser truncado",
//   textoNota: "Conteúdo da nota que pode ocupar até duas linhas e ser truncado se ultrapassar o espaço disponível",
//   docsArray: [
//     { url: "link1", nome: "documento1.pdf", tamanho: "7.4mb" },
//     { url: "link2", nome: "documento2.pdf", tamanho: "5.2mb" },
//     // ...
//   ]
// };

const AnotacoesCard = ({ nota }) => {
    const {
        dataConsulta,
        dataCriacao,
        tituloNota,
        textoNota,
        docsArray = [],
    } = nota || {};

    // Se houver mais de um item nos documentos, exibe o círculo com a contagem
    const showDocsCircle = docsArray.length > 1;
    // Se houver pelo menos um documento, exibe a área de pdf
    const showPdfInfo = docsArray.length >= 1;
    const firstDoc = docsArray[0] || {};

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                padding: "19px 43px",
                alignItems: "flex-start",
                gap: "48px",
                borderRadius: "30px",
                border: "1px solid #EAECEF",
                background: "#FFF",
                maxWidth: "1110px",
            }}
        >
            {/* Card Data Consulta */}
            {dataConsulta && (
                <Box
                    sx={{
                        display: "inline-flex",
                        height: "32px",
                        padding: "4px 13.6px",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "8px",
                        flexShrink: 0,
                        borderRadius: "79.2px",
                        border: "0.8px solid #B9D6FF",
                        background: "#EDF5FF",
                        color: "#2971FF",
                        fontFamily: "Gellix",
                        fontSize: "12.8px",
                        fontWeight: 500,
                        lineHeight: "12.8px",
                        position: "relative",
                    }}
                >
                    {/* Ponto azul: posicionado 13.8px da borda esquerda */}
                    <Box
                        sx={{
                            position: "absolute",
                            left: "13.8px",
                            width: "6.4px",
                            height: "6.4px",
                            backgroundColor: "#1852FE",
                            borderRadius: "50%",
                        }}
                    />
                    {/* Adiciona padding à esquerda para compensar o ponto e o gap de 8px */}
                    <Box sx={{ pl: "21.8px" }}>{dataConsulta}</Box>
                </Box>
            )}

            {/* Data Criação */}
            {dataCriacao && (
                <Typography
                    sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        color: "#111E5A",
                        fontFamily: "Gellix",
                        fontSize: "14px",
                        fontWeight: 500,
                        lineHeight: "28.8px",
                    }}
                >
                    {dataCriacao}
                </Typography>
            )}

            {/* Título da Nota */}
            {tituloNota && (
                <Typography
                    sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "#111E5A",
                        fontFamily: "Gellix",
                        fontSize: "25px",
                        fontWeight: 500,
                        lineHeight: "42.703px",
                        maxWidth: "156px",
                    }}
                >
                    {tituloNota}
                </Typography>
            )}

            {/* Texto da Nota – máximo de 2 linhas */}
            {textoNota && (
                <Typography
                    sx={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        color: "#111E5A",
                        fontFamily: "Gellix",
                        fontSize: "16px",
                        fontWeight: 500,
                        lineHeight: "24px",
                        maxWidth: "333px",
                    }}
                >
                    {textoNota}
                </Typography>
            )}

            {/* Seção de documentos */}
            {showPdfInfo && (
                <Box sx={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {showDocsCircle && (
                        <Box
                            sx={{
                                width: "30px",
                                height: "30px",
                                borderRadius: "50%",
                                backgroundColor: "#1852FE",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <Typography
                                sx={{
                                    color: "#FFF",
                                    fontFamily: "Gellix",
                                    fontSize: "16px",
                                    fontWeight: 500,
                                }}
                            >
                                {`+${docsArray.length - 1}`}
                            </Typography>
                        </Box>
                    )}
                    <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Box
                            component="img"
                            src="/pdf.png"
                            alt="PDF"
                            sx={{ width: "30px", height: "30px", flexShrink: 0 }}
                        />
                        <Box>
                            <Typography
                                sx={{
                                    color: "#111E5A",
                                    fontFamily: "Gellix",
                                    fontSize: "16px",
                                    fontWeight: 500,
                                }}
                            >
                                {firstDoc.nome || "-"}
                            </Typography>
                            <Typography
                                sx={{
                                    color: "#111E5A",
                                    opacity: 0.33,
                                    fontFamily: "Gellix",
                                    fontSize: "16px",
                                    fontWeight: 500,
                                }}
                            >
                                {firstDoc.tamanho || "-"}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default AnotacoesCard;
