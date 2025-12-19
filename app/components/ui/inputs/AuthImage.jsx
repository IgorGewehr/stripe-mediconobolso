"use client";

import { Box, Paper, Typography, useTheme, useMediaQuery } from "@mui/material";
import React from "react";

const AuthImage = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    return (
        <Box
            sx={{
                position: "relative",
                width: "100%",
                height: "100vh",
                overflow: "hidden",
                display: { xs: "none", md: "block" },
            }}
        >
            {/* Imagem de fundo */}
            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    backgroundImage: 'url("/fundo.jpg")',
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                }}
            />

            {/* Imagem do doutor sobreposta na parte inferior */}
            <Box
                component="img"
                src="/doctor.png"
                alt="Doctor"
                sx={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    maxWidth: { xs: "250px", sm: "300px", md: "400px" },
                    width: "auto",
                    height: "auto",
                }}
            />

            {/* Card de depoimento */}
            <Box
                sx={{
                    position: "absolute",
                    bottom: { xs: 50, sm: 80, md: 100 },
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: { xs: "90%", sm: "80%", md: 656 },
                    maxWidth: { xs: "350px", sm: "500px", md: "656px" },
                    height: "auto",
                    minHeight: { xs: "180px", sm: "220px", md: "272px" },
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        borderRadius: { xs: 3, sm: 4, md: 5 },
                        p: { xs: 2, sm: 2.5, md: 3 },
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "background.paper",
                    }}
                >
                    {/* Ícone de aspas no canto superior esquerdo */}
                    <Box
                        component="img"
                        src="/aspas.svg"
                        alt="Aspas"
                        sx={{
                            position: "absolute",
                            top: { xs: 12, sm: 14, md: 16 },
                            left: { xs: 12, sm: 14, md: 16 },
                            width: { xs: 24, sm: 28, md: 32 },
                            height: "auto",
                        }}
                    />

                    <Typography
                        variant="body1"
                        textAlign="center"
                        sx={{ 
                            mt: { xs: 1.5, sm: 2 }, 
                            mb: { xs: 1.5, sm: 2 }, 
                            px: { xs: 1, sm: 1.5, md: 2 },
                            fontSize: { xs: "0.875rem", sm: "1rem" },
                            lineHeight: { xs: 1.4, sm: 1.5 }
                        }}
                    >
                        Plataforma muito intuitiva e prática. Facilita o acompanhamento dos pacientes e economiza tempo na organização das consultas e receitas. Excelente ferramenta!
                    </Typography>
                </Paper>
            </Box>
        </Box>
    );
};

export default AuthImage;
