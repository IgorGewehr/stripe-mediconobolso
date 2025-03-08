import { Box, Paper, Typography } from "@mui/material";
import React from "react";

const AuthImage = () => {
    return (
        <Box
            sx={{
                position: "relative",
                width: "100%",
                height: "100vh",
                overflow: "hidden",
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
                    maxWidth: "400px",
                    width: "auto",
                    height: "auto",
                }}
            />

            {/* Card de depoimento */}
            <Box
                sx={{
                    position: "absolute",
                    bottom: 100,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 656,
                    height: 272,
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        borderRadius: 5,
                        p: 3,
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
                            top: 16,
                            left: 16,
                            width: 32,
                            height: "auto",
                        }}
                    />

                    <Typography
                        variant="body1"
                        textAlign="center"
                        sx={{ mt: 2, mb: 2, px: 2 }}
                    >
                        Plataforma muito intuitiva e prática. Facilita o acompanhamento dos pacientes e economiza tempo na organização das consultas e receitas. Excelente ferramenta!
                    </Typography>
                </Paper>
            </Box>
        </Box>
    );
};

export default AuthImage;
