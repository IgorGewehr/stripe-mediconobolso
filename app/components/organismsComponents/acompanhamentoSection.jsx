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
import ReceitaDialog from "./receitasDialog";
import ExamDialog from "./examDialog";

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
                maxWidth: "200px",
                height: "200px",
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
                        mt: "10px",
                        width: 115,
                        height: 125,
                        mb: 1,
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
                            fontSize: 24,
                            fontWeight: 500,
                            textAlign: "start", // Garante o alinhamento do texto à esquerda
                            flexGrow: 1,
                        }}
                    >
                        {tipo}
                    </Typography>

                    <IconButton
                        sx={{
                            width: 28,
                            height: 28,
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
export default function AcompanhamentoSection({ pacienteId, doctorId, patientData, onNotaUpdated, forceUpdateNotas }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const router = useRouter();

    const [openAnamneseDialog, setOpenAnamneseDialog] = useState(false);
    const [openReceitaDialog, setOpenReceitaDialog] = useState(false);
    const [openExamDialog, setOpenExamDialog] = useState(false); // Add exam dialog state

    // Handler for opening anamnese dialog
    const handleAnamneseClick = (isAdd) => {
        console.log(`Clicou em Anamnese ${isAdd ? "(adicionar)" : ""} para o paciente ${pacienteId}`);
        setOpenAnamneseDialog(true);
    };

    const handleReceitasClick = (isAdd) => {
        console.log(`Clicou em Receitas ${isAdd ? "(adicionar)" : ""} para o paciente ${pacienteId}`);
        setOpenReceitaDialog(true);
    };

    // Handler for opening exam dialog
    const handleExamesClick = (isAdd) => {
        console.log(`Clicou em Exames ${isAdd ? "(adicionar)" : ""} para o paciente ${pacienteId}`);
        setOpenExamDialog(true);
    };

    // Update handlers for saving/updating
    const handleSaveAnamnese = async (anamneseId) => {
        console.log(`Anamnese ${anamneseId} salva com sucesso!`);
        setOpenAnamneseDialog(false);

        if (forceUpdateNotas) {
            console.log("Forçando atualização de notas após salvar anamnese");
            await forceUpdateNotas();
        }

        if (onNotaUpdated) {
            onNotaUpdated();
        }
    };

    const handleSaveReceita = async (receitaId) => {
        console.log(`Receita ${receitaId} salva com sucesso!`);
        setOpenReceitaDialog(false);

        if (forceUpdateNotas) {
            console.log("Forçando atualização de notas após salvar receita");
            await forceUpdateNotas();
        }

        if (onNotaUpdated) {
            onNotaUpdated();
        }
    };

    // Add handler for saving exams
    const handleSaveExam = async (examData) => {
        try {
            console.log("Salvando exame:", examData);
            // Create the exam using Firebase service
            const examId = await FirebaseService.createExam(doctorId, pacienteId, examData);

            console.log(`Exame ${examId} salvo com sucesso!`);
            setOpenExamDialog(false);

            // Force update notes if available
            if (forceUpdateNotas) {
                console.log("Forçando atualização de notas após salvar exame");
                await forceUpdateNotas();
            }

            // Notify parent component
            if (onNotaUpdated) {
                onNotaUpdated();
            }

            return examId;
        } catch (error) {
            console.error("Erro ao salvar exame:", error);
            alert("Erro ao salvar exame. Por favor, tente novamente.");
            return null;
        }
    };

    // Close handlers
    const handleCloseExamDialog = () => {
        setOpenExamDialog(false);
    };

    return (
        <Box sx={{ width: "100%", maxWidth: "840px" }}>
            {/* Title */}
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

            {/* Grid of cards */}
            <Grid container spacing={1}>
                <Grid item xs={12} sm={6} md={3.4}>
                    <AcompanhamentoCard
                        tipo="Anamnese"
                        icone="/anamnesecard.svg"
                        onClick={handleAnamneseClick}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3.4}>
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

            {/* Dialogs */}
            <AnamneseDialog
                open={openAnamneseDialog}
                onClose={() => setOpenAnamneseDialog(false)}
                patientId={pacienteId}
                doctorId={doctorId}
                onSave={handleSaveAnamnese}
            />

            <ReceitaDialog
                open={openReceitaDialog}
                onClose={() => setOpenReceitaDialog(false)}
                patientId={pacienteId}
                doctorId={doctorId}
                onSave={handleSaveReceita}
            />

            {/* Add the ExamDialog */}
            <ExamDialog
                open={openExamDialog}
                onClose={handleCloseExamDialog}
                patientId={pacienteId}
                doctorId={doctorId}
                onSave={handleSaveExam}
            />
        </Box>
    );
}