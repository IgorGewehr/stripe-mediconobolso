"use client";
import React from "react";
import {
    Box,
    Typography,
    Card,
    CardContent,
    IconButton,
    Grid,
    useTheme,
    useMediaQuery
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

// Paleta de cores (pode extrair para outro arquivo se quiser)
const themeColors = {
    primary: "#1852FE",
    textPrimary: "#111E5A",
};

// Card de acompanhamento (Anamnese, Receitas, Exames)
function AcompanhamentoCard({ tipo, icone }) {
    return (
        <Card
            sx={{
                width: "100%",
                maxWidth: "240px",
                height: "240px",
                borderRadius: "20px",
                boxShadow: "0px 8px 24px 0px rgba(0, 0, 0, 0.04)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                p: 2,
            }}
        >
            <CardContent
                sx={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 0,
                }}
            >
                {/* Ícone central */}
                <Box
                    component="img"
                    src={icone}
                    alt={tipo}
                    sx={{
                        width: 130.4,
                        height: 150,
                        mb: 2,
                    }}
                />

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "row",
                        gap: 2,
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        pl: "10px",
                        pr: "10px",
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            color: themeColors.textPrimary,
                            fontFamily: "Gellix",
                            fontSize: 25,
                            fontWeight: 500,
                            textAlign: "start", // Garante o alinhamento do texto à esquerda
                            flexGrow: 1,
                        }}
                    >
                        {tipo}
                    </Typography>

                    <IconButton
                        sx={{
                            width: 36,
                            height: 36,
                            backgroundColor: themeColors.primary,
                            color: "#FFF",
                            "&:hover": {
                                backgroundColor: "#0d47e0",
                            },
                        }}
                    >
                        <AddIcon />
                    </IconButton>
                </Box>
            </CardContent>
        </Card>

    );
}

function AcompanhamentoCardExames({ tipo, icone }) {
    return (
        <Card
            sx={{
                width: "100%",
                maxWidth: "240px",
                height: "240px",
                borderRadius: "20px",
                boxShadow: "0px 8px 24px 0px rgba(0, 0, 0, 0.04)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                p: 2,
            }}
        >
            <CardContent
                sx={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 0,
                }}
            >
                {/* Ícone central */}
                <Box
                    component="img"
                    src={icone}
                    alt={tipo}
                    sx={{
                        width: 130,
                        height: 200,
                        mb: 2,
                    }}
                />

                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "row",
                        gap: 2,
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            color: themeColors.textPrimary,
                            fontFamily: "Gellix",
                            fontSize: 25,
                            fontWeight: 500,
                            textAlign: "start", // Garante o alinhamento do texto à esquerda
                            flexGrow: 1,
                        }}
                    >
                        {tipo}
                    </Typography>

                    <IconButton
                        sx={{
                            width: 36,
                            height: 36,
                            backgroundColor: themeColors.primary,
                            color: "#FFF",
                            "&:hover": {
                                backgroundColor: "#0d47e0",
                            },
                        }}
                    >
                        <AddIcon />
                    </IconButton>
                </Box>
            </CardContent>
        </Card>

    );
}


// Seção que agrupa os 3 cards
export default function AcompanhamentoSection() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    return (
        <Box sx={{ width: "100%", maxWidth: "840px" }}>
            {/* Título */}
            <Typography
                variant="h4"
                sx={{
                    color: themeColors.textPrimary,
                    fontFamily: "Gellix",
                    fontSize: 30,
                    fontWeight: 500,
                    mb: 3,
                }}
            >
                Acompanhamento
            </Typography>

            {/* Grid de cards */}
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                    <AcompanhamentoCard tipo="Anamnese" icone="/anamnesecard.svg" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <AcompanhamentoCard tipo="Receitas" icone="/receitascard.svg" />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <AcompanhamentoCard tipo="Exames" icone="/examescard.png" />
                </Grid>
            </Grid>
        </Box>
    );
}
