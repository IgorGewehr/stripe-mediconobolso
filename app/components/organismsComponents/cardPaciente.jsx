"use client";
import React, { useState } from "react";
import {
    Paper,
    Box,
    Typography,
    IconButton,
    Avatar,
    Chip,
    Stack,
    Button,
    useMediaQuery,
    useTheme
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";

// Color palette
const themeColors = {
    primary: "#1852FE",
    textPrimary: "#111E5A",
    textSecondary: "#666",
    lightBg: "#F1F3FA",
    borderColor: "rgba(0, 0, 0, 0.10)",
    chronic: {
        fumante: { bg: "#E3FAFC", color: "#15AABF" },
        obeso: { bg: "#FFF0F6", color: "#D6336C" },
        hipertenso: { bg: "#E6FCF5", color: "#2B8A3E" },
    },
};

// ----------------------
// Subcomponent: Card1
// ----------------------
function Card1({ paciente, expanded, onToggle }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <Paper
            elevation={expanded ? 4 : 0}
            sx={{
                position: "relative",
                width: "350px",
                boxSizing: "border-box",
                backgroundColor: "#fff",
                borderRadius: expanded ? "40px 0 0 40px" : "40px",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                border: expanded ? "none" : `1px solid ${themeColors.borderColor}`,
                height: "auto",
                zIndex: expanded ? 10 : 1,
            }}
        >
            {/* Overlay image */}
            <Box
                component="img"
                src="/layeruser.png"
                alt="Layer"
                sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "200px",
                    height: "170px",
                    zIndex: 0,
                }}
            />

            <Box sx={{ p: 3, pb: 6 }}>
                {/* Avatar/Photo */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        position: "relative",
                        mb: 3,
                        zIndex: 1,
                    }}
                >
                    {paciente.fotoPerfil ? (
                        <Avatar
                            src={paciente.fotoPerfil}
                            alt={paciente.nome}
                            sx={{
                                width: 110,
                                height: 110,
                                border: `3px solid ${themeColors.primary}`,
                                position: "relative",
                            }}
                        />
                    ) : (
                        <Avatar
                            sx={{
                                width: 110,
                                height: 110,
                                border: `3px solid ${themeColors.primary}`,
                                bgcolor: "#FFF",
                                position: "relative",
                            }}
                        >
                            <PersonIcon sx={{ color: "#B9D6FF", fontSize: 60 }} />
                        </Avatar>
                    )}

                    {/* Verification Icon */}
                    <Box
                        sx={{
                            position: "absolute",
                            top: 0,
                            left: 75,
                            width: 35,
                            height: 35,
                            borderRadius: "50%",
                            backgroundColor: themeColors.primary,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "2px solid white",
                            zIndex: 2,
                        }}
                    >
                        <Box
                            component="img"
                            src="/check.svg"
                            alt="Verificado"
                            sx={{
                                width: 12,
                                height: 12,
                                color: "#FFF",
                            }}
                        />
                    </Box>
                </Box>

                {/* Patient Name */}
                <Typography
                    variant="h4"
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix",
                        fontSize: 24,
                        fontWeight: 500,
                        mb: 2,
                        zIndex: 1,
                        position: "relative",
                    }}
                >
                    {paciente.nome || "Nome não informado"}
                </Typography>

                {/* Expand/Collapse Button */}
                <Button
                    onClick={onToggle}
                    variant="contained"
                    endIcon={expanded ? <KeyboardArrowLeftIcon /> : <KeyboardArrowRightIcon />}
                    sx={{
                        height: 44,
                        borderRadius: 99,
                        backgroundColor: themeColors.primary,
                        color: "#FFF",
                        fontFamily: "Gellix",
                        fontSize: 14,
                        fontWeight: 500,
                        textTransform: "none",
                        mb: 4,
                        "&:hover": {
                            backgroundColor: "#0d47e0",
                        },
                    }}
                >
                    Ver mais informações
                </Button>

                {/* Chronic Diseases */}
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix",
                        fontSize: 14,
                        fontWeight: 500,
                        opacity: 0.33,
                        mb: 1,
                    }}
                >
                    Doenças Crônicas
                </Typography>

                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
                    {paciente.chronicDiseases && paciente.chronicDiseases.length > 0 ? (
                        paciente.chronicDiseases.map((disease, index) => {
                            let colorScheme = { bg: "#E3FAFC", color: "#15AABF" };
                            if (disease.toLowerCase() === "fumante") {
                                colorScheme = themeColors.chronic.fumante;
                            } else if (disease.toLowerCase() === "obeso") {
                                colorScheme = themeColors.chronic.obeso;
                            } else if (disease.toLowerCase() === "hipertenso") {
                                colorScheme = themeColors.chronic.hipertenso;
                            }
                            return (
                                <Chip
                                    key={index}
                                    label={disease}
                                    sx={{
                                        height: 34,
                                        borderRadius: 99,
                                        padding: "0 15px",
                                        backgroundColor: colorScheme.bg,
                                        color: colorScheme.color,
                                        fontFamily: "Gellix",
                                        fontSize: 14,
                                        fontWeight: 500,
                                    }}
                                />
                            );
                        })
                    ) : (
                        <Chip
                            label="-"
                            sx={{
                                height: 34,
                                borderRadius: 99,
                                padding: "0 15px",
                                backgroundColor: "#EEE",
                                color: "#AAA",
                                fontFamily: "Gellix",
                                fontSize: 14,
                                fontWeight: 500,
                            }}
                        />
                    )}
                </Stack>

                {/* General Information */}
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix",
                        fontSize: 14,
                        fontWeight: 500,
                        opacity: 0.33,
                        mb: 1,
                    }}
                >
                    Informações Gerais
                </Typography>

                <Stack spacing={2} sx={{ mb: 3 }}>
                    {/* Blood Type */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                            component="img"
                            src="/sangue.svg"
                            alt="Tipo Sanguíneo"
                            sx={{ width: 24, height: 24 }}
                        />
                        <Typography
                            sx={{
                                color: themeColors.textPrimary,
                                fontFamily: "Gellix",
                                fontSize: 15,
                                fontWeight: 500,
                            }}
                        >
                            Tipo Sanguíneo:
                        </Typography>
                        <Typography
                            sx={{
                                color: themeColors.primary,
                                fontFamily: "Gellix",
                                fontSize: 15,
                                fontWeight: 500,
                            }}
                        >
                            {paciente.tipoSanguineo || "-"}
                        </Typography>
                    </Stack>

                    {/* Birth Date */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                            component="img"
                            src="/nascimento.svg"
                            alt="Data de Nascimento"
                            sx={{ width: 24, height: 24 }}
                        />
                        <Typography
                            sx={{
                                color: themeColors.textPrimary,
                                fontFamily: "Gellix",
                                fontSize: 15,
                                fontWeight: 500,
                            }}
                        >
                            Data de Nascimento:
                        </Typography>
                        <Typography
                            sx={{
                                color: themeColors.primary,
                                fontFamily: "Gellix",
                                fontSize: 15,
                                fontWeight: 500,
                            }}
                        >
                            {paciente.dataNascimento || "-"}
                        </Typography>
                    </Stack>
                </Stack>

                {/* Contact */}
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix",
                        fontSize: 14,
                        fontWeight: 500,
                        opacity: 0.33,
                        mb: 1,
                    }}
                >
                    Contato
                </Typography>

                <Stack spacing={2}>
                    {/* Mobile */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                            component="img"
                            src="/celular.svg"
                            alt="Celular"
                            sx={{ width: 24, height: 24 }}
                        />
                        <Typography
                            sx={{
                                color: themeColors.textPrimary,
                                fontFamily: "Gellix",
                                fontSize: 15,
                                fontWeight: 500,
                            }}
                        >
                            Celular:
                        </Typography>
                        <Typography
                            sx={{
                                color: themeColors.primary,
                                fontFamily: "Gellix",
                                fontSize: 15,
                                fontWeight: 500,
                            }}
                        >
                            {paciente.contato?.celular || "-"}
                        </Typography>
                    </Stack>

                    {/* Landline */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                            component="img"
                            src="/telefone.svg"
                            alt="Telefone"
                            sx={{ width: 24, height: 24 }}
                        />
                        <Typography
                            sx={{
                                color: themeColors.textPrimary,
                                fontFamily: "Gellix",
                                fontSize: 15,
                                fontWeight: 500,
                            }}
                        >
                            Fixo:
                        </Typography>
                        <Typography
                            sx={{
                                color: themeColors.primary,
                                fontFamily: "Gellix",
                                fontSize: 15,
                                fontWeight: 500,
                            }}
                        >
                            {paciente.contato?.fixo || "-"}
                        </Typography>
                    </Stack>

                    {/* Email */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                            component="img"
                            src="/email.svg"
                            alt="Email"
                            sx={{ width: 24, height: 24 }}
                        />
                        <Typography
                            sx={{
                                color: themeColors.textPrimary,
                                fontFamily: "Gellix",
                                fontSize: 15,
                                fontWeight: 500,
                            }}
                        >
                            Email:
                        </Typography>
                        <Typography
                            sx={{
                                color: themeColors.primary,
                                fontFamily: "Gellix",
                                fontSize: 15,
                                fontWeight: 500,
                                wordBreak: "break-word",
                            }}
                        >
                            {paciente.contato?.email || "-"}
                        </Typography>
                    </Stack>
                </Stack>
            </Box>
        </Paper>
    );
}

// ----------------------
// Subcomponent: Card2
// ----------------------
// ----------------------
// Subcomponent: Card2
// ----------------------
function Card2({ paciente }) {
    // Helper to create chips
    const renderChips = (items = []) => {
        return items.length > 0 ? (
            items.map((item, idx) => (
                <Chip
                    key={idx}
                    label={item}
                    sx={{
                        height: 34,
                        padding: "0 15px",
                        borderRadius: 99,
                        border: `1px solid #CED4DA`,
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix",
                        fontSize: 14,
                        fontWeight: 500,
                    }}
                />
            ))
        ) : (
            <Chip
                label="-"
                sx={{
                    height: 34,
                    padding: "0 15px",
                    borderRadius: 99,
                    border: `1px solid #CED4DA`,
                    color: themeColors.textPrimary,
                    fontFamily: "Gellix",
                    fontSize: 14,
                    fontWeight: 500,
                }}
            />
        );
    };

    return (
        <Paper
            elevation={4}
            sx={{
                width: "420px", // Slightly narrower to create space between cards
                height: "100%", // Match height of Card1
                borderRadius: "0 40px 40px 0",
                border: `1px solid ${themeColors.borderColor}`,
                backgroundColor: "#F1F3FA",
                boxSizing: "border-box",
                overflow: "hidden",
                zIndex: 5,
                margin: "0 0 0 10px", // Add margin on the left side for space between cards
            }}
        >
            <Box
                sx={{
                    p: 3,
                    height: "100%",
                    overflow: "auto",
                    "&::-webkit-scrollbar": {
                        width: "6px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "rgba(0,0,0,0.2)",
                        borderRadius: "10px",
                    },
                }}
            >
                {/* Complete Address */}
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix",
                        fontSize: 14,
                        fontWeight: 500,
                        opacity: 0.33,
                        mb: 2,
                    }}
                >
                    Endereço Completo
                </Typography>

                <Stack spacing={1} sx={{ mb: 3 }}>
                    {/* Address */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                            component="img"
                            src="/endereco.svg"
                            alt="Endereço"
                            sx={{ width: 24, height: 24 }}
                        />
                        <Typography
                            sx={{
                                color: themeColors.textPrimary,
                                fontFamily: "Gellix",
                                fontSize: 15,
                                fontWeight: 500,
                            }}
                        >
                            Endereço:
                        </Typography>
                        <Typography
                            sx={{
                                color: themeColors.primary,
                                fontFamily: "Gellix",
                                fontSize: 15,
                                fontWeight: 500,
                            }}
                        >
                            {paciente.endereco || "-"}
                        </Typography>
                    </Stack>

                    {/* City */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                            component="img"
                            src="/cidade.svg"
                            alt="Cidade"
                            sx={{ width: 24, height: 24 }}
                        />
                        <Typography
                            sx={{
                                color: themeColors.textPrimary,
                                fontFamily: "Gellix",
                                fontSize: 15,
                                fontWeight: 500,
                            }}
                        >
                            Cidade:
                        </Typography>
                        <Typography
                            sx={{
                                color: themeColors.primary,
                                fontFamily: "Gellix",
                                fontSize: 15,
                                fontWeight: 500,
                            }}
                        >
                            {paciente.cidade || "-"}
                        </Typography>
                    </Stack>

                    {/* Zip Code */}
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box
                            component="img"
                            src="/cep.svg"
                            alt="CEP"
                            sx={{ width: 24, height: 24 }}
                        />
                        <Typography
                            sx={{
                                color: themeColors.textPrimary,
                                fontFamily: "Gellix",
                                fontSize: 15,
                                fontWeight: 500,
                            }}
                        >
                            CEP:
                        </Typography>
                        <Typography
                            sx={{
                                color: themeColors.primary,
                                fontFamily: "Gellix",
                                fontSize: 15,
                                fontWeight: 500,
                            }}
                        >
                            {paciente.cep || "-"}
                        </Typography>
                    </Stack>
                </Stack>

                {/* Surgeries */}
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix",
                        fontSize: 14,
                        fontWeight: 500,
                        opacity: 0.33,
                        mb: 2,
                    }}
                >
                    Cirurgias
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
                    {renderChips(paciente.cirurgias)}
                </Stack>

                {/* Allergies */}
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix",
                        fontSize: 14,
                        fontWeight: 500,
                        opacity: 0.33,
                        mb: 2,
                    }}
                >
                    Alergias
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
                    {renderChips(paciente.alergias)}
                </Stack>

                {/* Physical Activity */}
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix",
                        fontSize: 14,
                        fontWeight: 500,
                        opacity: 0.33,
                        mb: 2,
                    }}
                >
                    Atividade Física
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
                    {renderChips(paciente.atividadeFisica)}
                </Stack>

                {/* Genetic Disease History */}
                <Typography
                    variant="subtitle2"
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix",
                        fontSize: 14,
                        fontWeight: 500,
                        opacity: 0.33,
                        mb: 1,
                    }}
                >
                    Histórico Doenças Genéticas
                </Typography>
                <Typography
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix",
                        fontSize: 14,
                        fontWeight: 500,
                        lineHeight: 1.5,
                    }}
                >
                    {paciente.historicoDoencasGeneticas || "-"}
                </Typography>
            </Box>
        </Paper>
    );
}

// ----------------------
// Main component
// (combines Card1 and Card2)
// ----------------------
export default function PacienteCard({ paciente }) {
    const [expanded, setExpanded] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const handleToggle = () => {
        setExpanded((prev) => !prev);
    };

    return (
        <Box
            sx={{
                position: "relative",
                width: "350px", // Fixed base width
                height: "auto",
            }}
        >
            <Box
                sx={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "row",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    marginBottom: "30px",
                }}
            >
                {/* Card1 - left side */}
                <Card1 paciente={paciente} expanded={expanded} onToggle={handleToggle} />

                {/* Card2 - right side (absolutely positioned to overlap) */}
                <Box
                    sx={{
                        position: "absolute",
                        left: "320px", // Ajustado para considerar a margem
                        top: 0,
                        height: "100%", // Garantir mesma altura
                        opacity: expanded ? 1 : 0,
                        visibility: expanded ? "visible" : "hidden",
                        transform: expanded ? "translateX(0)" : "translateX(-30px)",
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        transitionDelay: expanded ? "0.1s" : "0s"
                    }}
                >
                    <Card2 paciente={paciente} />
                </Box>
            </Box>
        </Box>
    );
}