"use client";
import {useState} from "react";
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
import { useRouter } from "next/navigation";
import AnamneseDialog from "./anamneseDialog";

// Paleta de cores (pode extrair para outro arquivo se quiser)
const themeColors = {
    primary: "#1852FE",
    textPrimary: "#111E5A",
};

// Card de acompanhamento (Anamnese, Receitas, Exames)
function AcompanhamentoCard({ tipo, icone, onClick }) {
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
                cursor: "pointer", // Indica que o card é clicável
                "&:hover": {
                    boxShadow: "0px 12px 28px 0px rgba(0, 0, 0, 0.1)",
                    transform: "translateY(-2px)",
                    transition: "all 0.2s ease-in-out"
                },
            }}
            onClick={onClick}
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
                        onClick={(e) => {
                            e.stopPropagation(); // Evita que o evento se propague para o card
                            if (onClick) onClick(true); // Indica que é uma ação de adição
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
export default function AcompanhamentoSection({ pacienteId, doctorId, patientData }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const router = useRouter();

    const [openAnamneseDialog, setOpenAnamneseDialog] = useState(false);

    // Handler para abrir o diálogo de anamnese
    const handleAnamneseClick = (isAdd) => {
        console.log(`Clicou em Anamnese ${isAdd ? "(adicionar)" : ""} para o paciente ${pacienteId}`);
        setOpenAnamneseDialog(true);
    };

    const handleReceitasClick = (isAdd) => {
        // Redirecionar para a página de nova receita ou lista de receitas
        console.log(`Clicou em Receitas ${isAdd ? "(adicionar)" : ""} para o paciente ${pacienteId}`);
        // router.push(`/receitas/${pacienteId}${isAdd ? "/nova" : ""}`);
    };

    const handleExamesClick = (isAdd) => {
        // Redirecionar para a página de novo exame ou lista de exames
        console.log(`Clicou em Exames ${isAdd ? "(adicionar)" : ""} para o paciente ${pacienteId}`);
        // router.push(`/exames/${pacienteId}${isAdd ? "/novo" : ""}`);
    };

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
                    <AcompanhamentoCard
                        tipo="Anamnese"
                        icone="/anamnesecard.svg"
                        onClick={handleAnamneseClick}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <AcompanhamentoCard
                        tipo="Receitas"
                        icone="/receitascard.svg"
                        onClick={handleReceitasClick}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <AcompanhamentoCard
                        tipo="Exames"
                        icone="/examescard.png"
                        onClick={handleExamesClick}
                    />
                </Grid>
            </Grid>
            {/* Renderiza o diálogo de anamnese */}
            <AnamneseDialog
                open={openAnamneseDialog}
                onClose={() => setOpenAnamneseDialog(false)}
                patientId={pacienteId}
                doctorId={doctorId}
                patientData={patientData}
            />
        </Box>
    );
}