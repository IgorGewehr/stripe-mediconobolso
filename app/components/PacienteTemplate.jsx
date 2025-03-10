"use client";
import React, { useState } from "react";
import {
    Box,
    Typography,
    Button,
    Paper,
    Grid,
    Card,
    CardContent,
    Divider,
    useMediaQuery,
    useTheme,
    IconButton,
    Chip,
    Stack,
    Avatar
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import AddIcon from "@mui/icons-material/Add";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import EditIcon from "@mui/icons-material/Edit";

// ----------------------------------
// Exemplo de dados do paciente
// ----------------------------------
const exemploPaciente = {
    nome: "Nélio Alves da Silva",
    fotoPerfil: "", // se vazio, usará fallback
    tipoSanguineo: "O+",
    dataNascimento: "09/02/1989",
    contato: {
        celular: "(048) 9999-9999",
        fixo: "(048) 999-999",
        email: "nelioalves1@gmail.com",
    },
    chronicDiseases: ["Fumante", "Obeso", "Hipertenso"],
    endereco: "Rua das Palmeiras, 123",
    cidade: "São Paulo",
    cep: "01234-567",
    cirurgias: ["Cirurgia A", "Cirurgia B"],
    alergias: ["Penicilina"],
    atividadeFisica: ["Caminhada", "Natação"],
    historicoDoencasGeneticas: "Nenhuma informação cadastrada",
};

// ----------------------------------
// Exemplo de dados de anotações
// ----------------------------------
const exemploAnotacoes = [
    {
        id: 1,
        titulo: "Lorem Título 1",
        data: "23/11/2024",
        criado: "24 de Dezembro/2024",
        descricao:
            "Paciente relatou melhora significativa após o início do uso de Dipirona 1g e Paracetamol 750mg",
        anexo: {
            nome: "pas-nelio.pdf",
            tipo: "PDF",
        },
    },
    {
        id: 2,
        titulo: "Lorem Título 2",
        data: "23/11/2024",
        criado: "24 de Dezembro/2024",
        descricao:
            "Paciente relatou melhora significativa após o início do uso de Dipirona 1g e Paracetamol 750mg",
        anexo: {
            nome: "pas-nelio.pdf",
            tipo: "PDF",
        },
    },
    {
        id: 3,
        titulo: "Lorem Título 3",
        data: "23/11/2024",
        criado: "24 de Dezembro/2024",
        descricao:
            "Paciente relatou melhora significativa após o início do uso de Dipirona 1g e Paracetamol 750mg",
        anexo: {
            nome: "pas-nelio.pdf",
            tipo: "PDF",
        },
    },
    {
        id: 4,
        titulo: "Lorem Título 4",
        data: "23/11/2024",
        criado: "24 de Dezembro/2024",
        descricao:
            "Paciente relatou melhora significativa após o início do uso de Dipirona 1g e Paracetamol 750mg",
        anexo: {
            nome: "pas-nelio.pdf",
            tipo: "PDF",
        },
    },
];

// ----------------------------------
// Paleta de cores centralizada
// ----------------------------------
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

// ----------------------------------
// COMPONENTE CARD1 – informações básicas do paciente
// ----------------------------------
const Card1 = ({ paciente, expanded, onToggle }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <Paper
            elevation={0}
            sx={{
                position: "relative",
                // Largura um pouco menor que 380px para ficar mais compacto
                width: isMobile ? "100%" : "350px",
                maxHeight: "780px", // Ajuste conforme necessário
                boxSizing: "border-box",
                backgroundColor: "#fff",
                borderRadius: expanded ? "40px 0 0 40px" : "40px",
                overflow: "hidden",
                transition: "all 0.3s ease",
                border: expanded ? "none" : `1px solid ${themeColors.borderColor}`,
            }}
        >
            {/* Imagem de overlay no canto superior direito */}
            <Box
                component="img"
                src="/layeruser.png"
                alt="Layer"
                sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "200px",
                    height: "200px",
                    zIndex: 0,
                }}
            />

            <Box sx={{ p: 3, height: "100%", overflowY: "auto", pb: 6 }}>
                {/* Perfil do paciente */}
                <Box sx={{ position: "relative", mb: 3, zIndex: 1 }}>
                    {paciente.fotoPerfil ? (
                        <Avatar
                            src={paciente.fotoPerfil}
                            alt={paciente.nome}
                            sx={{
                                width: 110,
                                height: 110,
                                border: `3px solid ${themeColors.primary}`,
                            }}
                        />
                    ) : (
                        <Avatar
                            sx={{
                                width: 110,
                                height: 110,
                                border: `3px solid ${themeColors.primary}`,
                                bgcolor: "#FFF",
                            }}
                        >
                            <PersonIcon sx={{ color: "#B9D6FF", fontSize: 60 }} />
                        </Avatar>
                    )}

                    {/* Verificação */}
                    <Box
                        sx={{
                            position: "absolute",
                            bottom: 6,
                            right: isMobile ? 32 : 0,
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            backgroundColor: themeColors.primary,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
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

                    {/* Ícone de edição */}
                    <IconButton
                        size="small"
                        sx={{
                            position: "absolute",
                            top: 0,
                            left: 80,
                            p: 0,
                        }}
                    >
                        <EditIcon sx={{ color: themeColors.primary, fontSize: 16 }} />
                    </IconButton>
                </Box>

                {/* Nome do paciente */}
                <Typography
                    variant="h4"
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix",
                        fontSize: 24, // um pouco menor
                        fontWeight: 500,
                        mb: 2,
                        zIndex: 1,
                        position: "relative",
                    }}
                >
                    {paciente.nome || "Nome não informado"}
                </Typography>

                {/* Botão de expandir/recolher */}
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

                {/* Doenças Crônicas */}
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

                {/* Informações Gerais */}
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
                    {/* Tipo Sanguíneo */}
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

                    {/* Data de Nascimento */}
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

                {/* Contato */}
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
                    {/* Celular */}
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

                    {/* Fixo */}
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
};

// ----------------------------------
// COMPONENTE CARD2 – informações complementares
// ----------------------------------
const Card2 = ({ paciente }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    // Helper para criar chips consistentes
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
            elevation={0}
            sx={{
                // Menor que 502px original
                width: isMobile ? "100%" : "440px",
                maxHeight: "780px", // Ajuste conforme necessário
                borderRadius: "0 40px 40px 0",
                border: `1px solid ${themeColors.borderColor}`,
                background: themeColors.lightBg,
                boxSizing: "border-box",
                overflow: "hidden",
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
                {/* Título "Endereço Completo" */}
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
                    {/* Endereço */}
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

                    {/* Cidade */}
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

                    {/* CEP */}
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

                {/* Cirurgias */}
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

                {/* Alergias */}
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

                {/* Atividade Física */}
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

                {/* Histórico de Doenças Genéticas */}
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
};

// ----------------------------------
// COMPONENTE PRINCIPAL: CardPaciente
// (une Card1 e Card2)
// ----------------------------------
const CardPaciente = ({ paciente = exemploPaciente }) => {
    const [expanded, setExpanded] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    const handleToggle = () => {
        setExpanded((prev) => !prev);
    };

    return (
        <Box
            sx={{
                width: "100%",
                // Se expandido, somar ~350 + 440 = 790 (ou algo perto de 800)
                maxWidth: expanded ? "800px" : "350px",
                height: "auto",
                maxHeight: "780px",
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                borderRadius: "40px",
                overflow: "hidden",
                transition: "all 0.3s ease-in-out",
            }}
        >
            {/* Card1 – lado esquerdo */}
            <Card1 paciente={paciente} expanded={expanded} onToggle={handleToggle} />

            {/* Se estiver expandido, renderiza o Card2 à direita */}
            {expanded && <Card2 paciente={paciente} />}
        </Box>
    );
};

// ----------------------------------
// COMPONENTES PARA ACOMPANHAMENTO
// ----------------------------------
const AcompanhamentoCard = ({ tipo, icone }) => {
    return (
        <Card
            sx={{
                width: "100%",
                maxWidth: "240px", // menor que 276px
                height: "240px",   // menor que 276px
                borderRadius: "20px",
                boxShadow: "0px 8px 24px 0px rgba(0, 0, 0, 0.04)",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <CardContent sx={{ textAlign: "center" }}>
                {/* Ícone central */}
                <Box
                    component="img"
                    src={icone}
                    alt={tipo}
                    sx={{
                        width: "64px", // menor que 80px
                        height: "64px",
                        mb: 2,
                    }}
                />

                {/* Título */}
                <Typography
                    variant="h6"
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix",
                        fontSize: 18,
                        fontWeight: 500,
                    }}
                >
                    {tipo}
                </Typography>
            </CardContent>

            {/* Botão de adicionar no canto superior direito */}
            <IconButton
                sx={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    width: "36px",
                    height: "36px",
                    backgroundColor: themeColors.primary,
                    color: "#FFF",
                    "&:hover": {
                        backgroundColor: "#0d47e0",
                    },
                }}
            >
                <AddIcon />
            </IconButton>
        </Card>
    );
};

const AcompanhamentoSection = () => {
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
                    fontSize: 26, // menor que 30
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
                    <AcompanhamentoCard tipo="Exames" icone="/examescard.svg" />
                </Grid>
            </Grid>
        </Box>
    );
};

// ----------------------------------
// COMPONENTES PARA ANOTAÇÕES
// ----------------------------------
const CriarNovaFichaButton = () => {
    return (
        <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
                height: "46px",
                padding: "0 24px",
                borderRadius: "99px",
                backgroundColor: themeColors.primary,
                color: "#FFF",
                fontFamily: "Gellix",
                fontSize: "14px",
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
};

const AnotacoesCard = ({ nota }) => {
    return (
        <Card
            sx={{
                width: "100%",
                // se quiser reduzir mais, troque para algo tipo 220px
                maxWidth: "240px",
                height: "190px",
                borderRadius: "20px",
                border: `1px solid ${themeColors.borderColor}`,
                boxShadow: "0px 8px 24px 0px rgba(0, 0, 0, 0.04)",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <CardContent sx={{ p: 2, display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Bolinha azul com data */}
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
                    variant="subtitle1"
                    sx={{
                        color: themeColors.textPrimary,
                        fontFamily: "Gellix",
                        fontSize: 16,
                        fontWeight: 500,
                        mb: 0.5,
                    }}
                >
                    {nota.titulo}
                </Typography>

                {/* Descrição truncada */}
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
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                    }}
                >
                    {nota.descricao}
                </Typography>

                {/* Footer */}
                <Box sx={{ mt: "auto" }}>
                    <Typography
                        variant="caption"
                        sx={{
                            color: themeColors.textSecondary,
                            fontFamily: "Gellix",
                            fontSize: 12,
                        }}
                    >
                        Criado em {nota.criado}
                    </Typography>

                    {nota.anexo && (
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mt: 1,
                            }}
                        >
                            <PictureAsPdfIcon sx={{ color: themeColors.primary, fontSize: 16 }} />
                            <Typography
                                variant="caption"
                                sx={{
                                    color: themeColors.primary,
                                    fontFamily: "Gellix",
                                    fontSize: 12,
                                    fontWeight: 500,
                                    cursor: "pointer",
                                }}
                            >
                                {nota.anexo.nome}
                            </Typography>
                            <IconButton
                                size="small"
                                sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    backgroundColor: `${themeColors.primary}20`,
                                    color: themeColors.primary,
                                }}
                            >
                                <AddIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

const AnotacoesGrid = ({ notas = [] }) => {
    return (
        <Box sx={{ width: "100%", maxWidth: "1000px" }}>
            {/* Header do grid: título e botão */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
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

            {/* Grid de notas com scroll se exceder altura (opcional) */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: 2,
                    maxHeight: "480px", // Se quiser um limite
                    overflowY: "auto",
                }}
            >
                {notas.map((nota, index) => (
                    <AnotacoesCard key={index} nota={nota} />
                ))}
            </Box>
        </Box>
    );
};

// ----------------------------------
// COMPONENTE FINAL: PacienteTemplate
// ----------------------------------
const PacienteTemplate = () => {
    const paciente = exemploPaciente;
    const notas = exemploAnotacoes;

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                p: 4,
                width: "100%",
                boxSizing: "border-box",
                // Se tiver um layout fixo com header, pode ajustar a altura:
                maxHeight: "calc(100vh - 64px)",
                overflowY: "auto",
            }}
        >
            {/* Card do Paciente */}
            <CardPaciente paciente={paciente} />

            {/* Seção de Acompanhamento */}
            <AcompanhamentoSection />

            {/* Grid de Anotações */}
            <AnotacoesGrid notas={notas} />
        </Box>
    );
};

export default PacienteTemplate;
