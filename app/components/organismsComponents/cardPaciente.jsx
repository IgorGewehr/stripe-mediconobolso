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
        <Box
            sx={{
                position: "relative",
                width: "350px",
                boxSizing: "border-box",
                backgroundColor: "#fff",
                borderRadius: expanded ? "40px 0 0 40px" : "40px",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                zIndex: expanded ? 10 : 1,
                display: "flex",
                flexDirection: "column",// Usa altura baseada no conteúdo
                minHeight: "0", // Remove altura mínima
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

            <Box sx={{ p: 3, pb: 3, flexGrow: 0, height: "max-content" }}>
                {/* Avatar/Photo */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        position: "relative",
                        mb: 2,
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
                        mb: 3,
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

                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
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

                <Stack spacing={2} sx={{ mb: 2 }}>
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
        </Box>
    );
}

// ----------------------
// Subcomponent: Card2
// ----------------------
function Card2({ paciente }) {
    return (
        // No componente Card2, substitua o Box inicial por este:
        // No componente Card2, substitua o Box inicial por este:
        <Box sx={{
            p: "25px 5px 5px 5px",
            m: '20px 20px 20px 20px',
            backgroundColor: '#F1F3FA',
            borderRadius: '20px 20px 20px 20px',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: "none", // Alterado de "calc(100% - 40px)" para "none"
            overflow: "visible", // Alterado de "auto" para "visible"
            height: "auto",
            minHeight: "0"
        }}>
            {/* Endereço Completo */}
            <Typography
                variant="subtitle2"
                sx={{
                    color: themeColors.textPrimary,
                    fontFamily: "Gellix",
                    fontSize: 16,
                    fontWeight: 500,
                    mb: 2,
                    ml: "10px"
                }}
            >
                Endereço Completo
            </Typography>

            {/* Endereço */}
            <Stack direction="row" alignItems="flex-start" spacing={2} sx={{ mb: 2, ml: "10px" }}>
                <Box
                    component="img"
                    src="/endereco.svg"
                    alt="Endereço"
                    sx={{ width: 24, height: 24, mt: 0.5 }}
                />
                <Box>
                    <Typography
                        sx={{
                            color: themeColors.textSecondary,
                            fontFamily: "Gellix",
                            fontSize: 14,
                            fontWeight: 500,
                            mb: 0.5,
                        }}
                    >
                        Endereço:
                    </Typography>
                    <Typography
                        sx={{
                            color: themeColors.primary,
                            fontFamily: "Gellix",
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                    >
                        {paciente.endereco?.rua
                            ? `${paciente.endereco.rua}, ${paciente.endereco.numero} - ${paciente.endereco.bairro}`
                            : "-"}
                    </Typography>
                </Box>
            </Stack>

            {/* Cidade */}
            <Stack direction="row" alignItems="flex-start" spacing={2} sx={{ mb: 2, ml: "10px" }}>
                <Box
                    component="img"
                    src="/cidade.svg"
                    alt="Cidade"
                    sx={{ width: 24, height: 24, mt: 0.5, }}
                />
                <Box>
                    <Typography
                        sx={{
                            color: themeColors.textSecondary,
                            fontFamily: "Gellix",
                            fontSize: 14,
                            fontWeight: 500,
                            mb: 0.5,
                            ml: "10px"
                        }}
                    >
                        Cidade:
                    </Typography>
                    <Typography
                        sx={{
                            color: themeColors.primary,
                            fontFamily: "Gellix",
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                    >
                        {paciente.endereco?.cidade
                            ? `${paciente.endereco.cidade} - ${paciente.endereco.estado}`
                            : "-"}
                    </Typography>
                </Box>
            </Stack>

            {/* CEP */}
            <Stack direction="row" alignItems="flex-start" spacing={2} sx={{ mb: 4, ml: "10px" }}>
                <Box
                    component="img"
                    src="/cep.svg"
                    alt="CEP"
                    sx={{ width: 24, height: 24, mt: 0.5, }}
                />
                <Box>
                    <Typography
                        sx={{
                            color: themeColors.textSecondary,
                            fontFamily: "Gellix",
                            fontSize: 14,
                            fontWeight: 500,
                            mb: 0.5,
                        }}
                    >
                        CEP:
                    </Typography>
                    <Typography
                        sx={{
                            color: themeColors.primary,
                            fontFamily: "Gellix",
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                    >
                        {paciente.endereco?.cep || "-"}
                    </Typography>
                </Box>
            </Stack>

            {/* Cirurgias */}
            <Typography
                variant="subtitle2"
                sx={{
                    color: themeColors.textPrimary,
                    fontFamily: "Gellix",
                    fontSize: 16,
                    fontWeight: 500,
                    mb: 1.5,
                    ml: "10px"
                }}
            >
                Cirurgias
            </Typography>

            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3, ml: "10px" }}>
                {paciente.cirurgias && paciente.cirurgias.length > 0 ? (
                    paciente.cirurgias.map((cirurgia, index) => (
                        <Chip
                            key={index}
                            label={cirurgia}
                            sx={{
                                height: 36,
                                borderRadius: 99,
                                padding: "0 15px",
                                backgroundColor: "#F8F9FB",
                                border: "1px solid #E5E9F2",
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
                            height: 36,
                            borderRadius: 99,
                            padding: "0 15px",
                            backgroundColor: "#F8F9FB",
                            border: "1px solid #E5E9F2",
                            color: "#AAA",
                            fontFamily: "Gellix",
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                    />
                )}
            </Stack>

            {/* Alergias */}
            <Typography
                variant="subtitle2"
                sx={{
                    color: themeColors.textPrimary,
                    fontFamily: "Gellix",
                    fontSize: 16,
                    fontWeight: 500,
                    mb: 1.5,
                    ml: "10px"
                }}
            >
                Alergias
            </Typography>

            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3, ml: "10px" }}>
                {paciente.alergias && paciente.alergias.length > 0 ? (
                    paciente.alergias.map((alergia, index) => (
                        <Chip
                            key={index}
                            label={alergia}
                            sx={{
                                height: 36,
                                borderRadius: 99,
                                padding: "0 15px",
                                backgroundColor: "#F8F9FB",
                                border: "1px solid #E5E9F2",
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
                            height: 36,
                            borderRadius: 99,
                            padding: "0 15px",
                            backgroundColor: "#F8F9FB",
                            border: "1px solid #E5E9F2",
                            color: "#AAA",
                            fontFamily: "Gellix",
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                    />
                )}
            </Stack>

            {/* Atividade Física */}
            <Typography
                variant="subtitle2"
                sx={{
                    color: themeColors.textPrimary,
                    fontFamily: "Gellix",
                    fontSize: 16,
                    fontWeight: 500,
                    mb: 1.5,
                    ml: "10px"
                }}
            >
                Atividade Física
            </Typography>

            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3, ml: "10px" }}>
                {paciente.atividadeFisica && paciente.atividadeFisica.length > 0 ? (
                    paciente.atividadeFisica.map((atividade, index) => (
                        <Chip
                            key={index}
                            label={atividade}
                            sx={{
                                height: 36,
                                borderRadius: 99,
                                padding: "0 15px",
                                backgroundColor: "#F8F9FB",
                                border: "1px solid #E5E9F2",
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
                            height: 36,
                            borderRadius: 99,
                            padding: "0 15px",
                            backgroundColor: "#F8F9FB",
                            border: "1px solid #E5E9F2",
                            color: "#AAA",
                            fontFamily: "Gellix",
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                    />
                )}
            </Stack>

            {/* Histórico/Doenças Genéticas */}
            <Typography
                variant="subtitle2"
                sx={{
                    color: themeColors.textPrimary,
                    fontFamily: "Gellix",
                    fontSize: 16,
                    fontWeight: 500,
                    mb: 1.5,
                    ml: "10px"
                }}
            >
                Histórico/Doenças Genéticas
            </Typography>

            <Typography
                sx={{
                    color: themeColors.textSecondary,
                    fontFamily: "Gellix",
                    fontSize: 14,
                    lineHeight: 1.6,
                    mb: 2,
                    ml: "10px"
                }}
            >
                {paciente.historicoMedico ||
                    "O paciente relata histórico familiar de hipertensão arterial em parentes de primeiro grau (pai e avô). Há também casos de diabetes tipo 2 em familiares maternos. Não há histórico conhecido de doenças genéticas raras ou hereditárias graves."}
            </Typography>
        </Box>
    );
}

// ----------------------
// Main component
// (combines Card1 and Card2)
// ----------------------
export default function PacienteCard({ paciente }) {
    const [expanded, setExpanded] = useState(false);

    const handleToggle = () => {
        setExpanded((prev) => !prev);
    };

    return (
        <Box
            sx={{
                position: "relative",
                width: expanded ? "770px" : "350px",
                transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                marginBottom: "20px",
                display: 'flex',
                flexShrink: 0,
                height: 'max-content',
                minHeight: "0",
                maxHeight: "none",
                alignSelf: "flex-start", // Força alinhamento no topo
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    display: "flex",
                    flexDirection: "row",
                    backgroundColor: "#fff",
                    borderRadius: "40px",
                    overflow: "visible", // Alterado de "hidden" para "visible"
                    border: `1px solid ${themeColors.borderColor}`,
                    width: '100%',
                    height: 'auto',
                    maxHeight: "none", // Removida a limitação de altura máxima
                    minHeight: "0",
                }}
            >
                {/* Card1 - lado esquerdo */}
                <Card1 paciente={paciente} expanded={expanded} onToggle={handleToggle} />

                {/* Card2 - lado direito */}
                {expanded && (
                    <Box
                        sx={{
                            width: "400px",
                            visibility: "visible",
                            transform: "translateX(0)",
                            opacity: expanded ? 1 : 0,
                            // Atraso na animação de opacidade para aparecer após a expansão da largura
                            transitionProperty: "width, opacity",
                            transitionDuration: "0.3s, 0.2s",
                            transitionDelay: "0s, 0.25s",
                            display: "flex",
                            flexDirection: "column",
                            borderRadius: "0 40px 40px 0",
                            flexGrow: 1,
                            height: 'auto',
                            minHeight: "0",
                            maxHeight: "none", // Removida a limitação de altura máxima
                        }}
                    >
                        <Card2 paciente={paciente} />
                    </Box>
                )}
            </Paper>
        </Box>
    );
}