"use client";
import React, { useState } from "react";
import { Box, Typography, Button, Avatar } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";

// Exemplo de dados do paciente (a "interface")
const exemploPaciente = {
    nome: "Dr. José Silva",
    fotoPerfil: "", // se vazio, usará fallback
    tipoSanguineo: "O+",
    dataNascimento: "15/03/1985",
    contato: {
        celular: "(11) 98765-4321",
        fixo: "(11) 3344-5566",
        email: "jose.silva@medico.com"
    },
    chronicDiseases: ["Hipertensão", "Diabetes"],
    // Dados para Card2:
    endereco: "Rua das Palmeiras, 123",
    cidade: "São Paulo",
    cep: "01234-567",
    cirurgias: ["Cirurgia A", "Cirurgia B"],
    alergias: ["Penicilina"],
    atividadeFisica: ["Caminhada", "Natação"],
    historicoDoencasGeneticas: "Nenhuma informação cadastrada"
};

//
// COMPONENTE CARD1 – informações básicas do paciente
//
const Card1 = ({ paciente, expanded, onToggle }) => {
    // Definição dos offsets (em pixels) conforme especificação:
    // Patient image: top: 48px, left: 35px; tamanho: 118x118
    // Nome: top = 48+118+17 = 183px, left: 33px
    // Botão “Ver mais informações”: top = 183+30+17 ≈ 230px, left: 33px
    // Label “Doenças Crônicas”: top = 230+52+45 = 327px, left: 33px
    // Grid de doenças inicia em: top = 327+20 = 347px
    // “Informações Gerais” – usaremos um offset fixo (ex.: 500px)
    return (
        <Box
            sx={{
                position: "relative",
                width: "380px",
                height: "817px",
                boxSizing: "border-box"
            }}
        >
            {/* Imagem de overlay (layeruser.png) no canto superior direito */}
            <Box
                component="img"
                src="/layeruser.png"
                alt="Layer"
                sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "239px",
                    height: "240px",
                    flexShrink: 0,
                    backgroundColor: "#1852FE",
                    mixBlendMode: "overlay"
                }}
            />

            {/* Imagem do paciente – posicionado a 48px do topo e 35px da esquerda */}
            <Box sx={{ position: "absolute", top: "48px", left: "35px" }}>
                {paciente.fotoPerfil ? (
                    <Box
                        component="img"
                        src={paciente.fotoPerfil}
                        alt={paciente.nome}
                        sx={{
                            width: "118px",
                            height: "118px",
                            borderRadius: "50%",
                            border: "3px solid #3378FF",
                            objectFit: "cover"
                        }}
                    />
                ) : (
                    <Box
                        sx={{
                            width: "118px",
                            height: "118px",
                            borderRadius: "50%",
                            border: "3px solid #3378FF",
                            backgroundColor: "#FFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        <PersonIcon sx={{ color: "#B9D6FF", fontSize: "60px" }} />
                    </Box>
                )}
                {/* Ícone de edição sobreposto na imagem do paciente */}
                <Box
                    sx={{
                        position: "absolute",
                        top: "2px",
                        left: "85px", // 85px da margem esquerda do container da imagem
                        width: "37px",
                        height: "37px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "transparent",
                        // Para simular o stroke e fill, o ícone editimage.svg deve ter esses atributos no SVG
                    }}
                >
                    <Box
                        component="img"
                        src="/editimage.svg"
                        alt="Editar"
                        sx={{
                            width: "12.25px",
                            height: "12.25px"
                        }}
                    />
                </Box>
            </Box>

            {/* Nome do paciente */}
            <Typography
                sx={{
                    position: "absolute",
                    top: "183px",
                    left: "33px",
                    color: "#111E5A",
                    fontFamily: "Gellix",
                    fontSize: "30px",
                    fontWeight: 500,
                    lineHeight: 1
                }}
            >
                {paciente.nome || "Nome não informado"}
            </Typography>

            {/* Botão "Ver mais informações" */}
            <Box sx={{ position: "absolute", top: "230px", left: "33px" }}>
                <Button
                    onClick={onToggle}
                    sx={{
                        display: "inline-flex",
                        height: "52px",
                        padding: "18px 27px",
                        gap: "10px",
                        borderRadius: "99px",
                        background: "#1852FE",
                        color: "#FFF",
                        fontFamily: "Gellix",
                        fontSize: "16px",
                        fontWeight: 500,
                        lineHeight: "16px",
                        textTransform: "none"
                    }}
                >
                    Ver mais informações
                    <Box
                        component="img"
                        src="/leftarrow.svg"
                        alt="Arrow"
                        sx={{
                            width: "18px",
                            height: "18px",
                            transform: expanded ? "rotate(180deg)" : "none"
                        }}
                    />
                </Button>
            </Box>

            {/* Label "Doenças Crônicas" */}
            <Typography
                sx={{
                    position: "absolute",
                    top: "327px",
                    left: "33px",
                    color: "#111E5A",
                    fontFamily: "Gellix",
                    fontSize: "14px",
                    fontWeight: 500,
                    opacity: 0.33
                }}
            >
                Doenças Crônicas
            </Typography>

            {/* Grid de Doenças Crônicas */}
            <Box
                sx={{
                    position: "absolute",
                    top: "347px",
                    left: "33px",
                    right: "33px",
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px"
                }}
            >
                {paciente.chronicDiseases && paciente.chronicDiseases.length > 0 ? (
                    paciente.chronicDiseases.map((disease, index) => {
                        // Combinações de cores (exemplos)
                        const combos = [
                            { bg: "#E3FAFC", color: "#15AABF" },
                            { bg: "#FFF0F6", color: "#D6336C" },
                            { bg: "#E6FCF5", color: "#2B8A3E" }
                        ];
                        const combo = combos[index % combos.length];
                        return (
                            <Box
                                key={index}
                                sx={{
                                    display: "inline-flex",
                                    height: "40px",
                                    padding: "12px 17px",
                                    alignItems: "center",
                                    gap: "10px",
                                    borderRadius: "99px",
                                    background: combo.bg,
                                    color: combo.color,
                                    fontFamily: "Gellix",
                                    fontSize: "16px",
                                    fontWeight: 500,
                                    justifyContent: "center"
                                }}
                            >
                                {disease}
                            </Box>
                        );
                    })
                ) : (
                    <Box
                        sx={{
                            display: "inline-flex",
                            height: "40px",
                            padding: "12px 17px",
                            alignItems: "center",
                            gap: "10px",
                            borderRadius: "99px",
                            background: "#EEE",
                            color: "#AAA",
                            fontFamily: "Gellix",
                            fontSize: "16px",
                            fontWeight: 500,
                            justifyContent: "center"
                        }}
                    >
                        -
                    </Box>
                )}
            </Box>

            {/* Seção "Informações Gerais" */}
            <Typography
                sx={{
                    position: "absolute",
                    top: "500px", // valor aproximado – ajuste conforme necessidade
                    left: "33px",
                    color: "#111E5A",
                    fontFamily: "Gellix",
                    fontSize: "14px",
                    fontWeight: 500,
                    opacity: 0.33
                }}
            >
                Informações Gerais
            </Typography>

            {/* Linha "Tipo Sanguíneo" */}
            <Box
                sx={{
                    position: "absolute",
                    top: "524px",
                    left: "33px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                }}
            >
                <Box
                    component="img"
                    src="/sangue.svg"
                    alt="Tipo Sanguíneo"
                    sx={{ width: "24px", height: "24px" }}
                />
                <Typography
                    sx={{
                        color: "#111E5A",
                        fontFamily: "Gellix",
                        fontSize: "16px",
                        fontWeight: 500
                    }}
                >
                    Tipo Sanguíneo:
                </Typography>
                <Typography
                    sx={{
                        color: "#1852FE",
                        fontFamily: "Gellix",
                        fontSize: "16px",
                        fontWeight: 500
                    }}
                >
                    {paciente.tipoSanguineo || "-"}
                </Typography>
            </Box>

            {/* Linha "Data de Nascimento" */}
            <Box
                sx={{
                    position: "absolute",
                    top: "557px",
                    left: "33px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                }}
            >
                <Box
                    component="img"
                    src="/nascimento.svg"
                    alt="Data de Nascimento"
                    sx={{ width: "24px", height: "24px" }}
                />
                <Typography
                    sx={{
                        color: "#111E5A",
                        fontFamily: "Gellix",
                        fontSize: "16px",
                        fontWeight: 500
                    }}
                >
                    Data de Nascimento:
                </Typography>
                <Typography
                    sx={{
                        color: "#1852FE",
                        fontFamily: "Gellix",
                        fontSize: "16px",
                        fontWeight: 500
                    }}
                >
                    {paciente.dataNascimento || "-"}
                </Typography>
            </Box>

            {/* Seção "Contato" */}
            <Typography
                sx={{
                    position: "absolute",
                    top: "611px",
                    left: "33px",
                    color: "#111E5A",
                    fontFamily: "Gellix",
                    fontSize: "14px",
                    fontWeight: 500,
                    opacity: 0.33
                }}
            >
                Contato
            </Typography>
            <Box
                sx={{
                    position: "absolute",
                    top: "635px",
                    left: "33px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px"
                }}
            >
                {/* Celular */}
                <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Box
                        component="img"
                        src="/celular.svg"
                        alt="Celular"
                        sx={{ width: "24px", height: "24px" }}
                    />
                    <Typography
                        sx={{
                            color: "#111E5A",
                            fontFamily: "Gellix",
                            fontSize: "16px",
                            fontWeight: 500
                        }}
                    >
                        Celular:
                    </Typography>
                    <Typography
                        sx={{
                            color: "#1852FE",
                            fontFamily: "Gellix",
                            fontSize: "16px",
                            fontWeight: 500
                        }}
                    >
                        {paciente.contato?.celular || "-"}
                    </Typography>
                </Box>
                {/* Fixo */}
                <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Box
                        component="img"
                        src="/telefone.svg"
                        alt="Telefone"
                        sx={{ width: "24px", height: "24px" }}
                    />
                    <Typography
                        sx={{
                            color: "#111E5A",
                            fontFamily: "Gellix",
                            fontSize: "16px",
                            fontWeight: 500
                        }}
                    >
                        Fixo:
                    </Typography>
                    <Typography
                        sx={{
                            color: "#1852FE",
                            fontFamily: "Gellix",
                            fontSize: "16px",
                            fontWeight: 500
                        }}
                    >
                        {paciente.contato?.fixo || "-"}
                    </Typography>
                </Box>
                {/* Email */}
                <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Box
                        component="img"
                        src="/email.svg"
                        alt="Email"
                        sx={{ width: "24px", height: "24px" }}
                    />
                    <Typography
                        sx={{
                            color: "#111E5A",
                            fontFamily: "Gellix",
                            fontSize: "16px",
                            fontWeight: 500
                        }}
                    >
                        Email:
                    </Typography>
                    <Typography
                        sx={{
                            color: "#1852FE",
                            fontFamily: "Gellix",
                            fontSize: "16px",
                            fontWeight: 500
                        }}
                    >
                        {paciente.contato?.email || "-"}
                    </Typography>
                </Box>
            </Box>
            {/* Spacer para deixar 43px do fundo */}
            <Box sx={{ position: "absolute", bottom: "43px" }} />
        </Box>
    );
};

//
// COMPONENTE CARD2 – informações complementares (endereço, cirurgias, etc.)
//
const Card2 = ({ paciente }) => {
    return (
        <Box
            sx={{
                width: "502px",
                height: "771px",
                flexShrink: 0,
                borderRadius: "40px",
                border: "1px solid rgba(0,0,0,0.10)",
                opacity: 0.44,
                background: "#F1F3FA",
                position: "relative",
                boxSizing: "border-box",
                padding: "42px 48px 0 48px" // top e left conforme especificação
            }}
        >
            {/* Título "Endereço Completo" */}
            <Typography
                sx={{
                    color: "#111E5A",
                    fontFamily: "Gellix",
                    fontSize: "14px",
                    fontWeight: 500,
                    opacity: 0.33,
                    mb: "16px"
                }}
            >
                Endereço Completo
            </Typography>
            {/* Linha de Endereço */}
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "8px" }}>
                <Box component="img" src="/endereco.svg" alt="Endereço" sx={{ width:"24px", height:"24px" }} />
                <Typography
                    sx={{
                        color: "#111E5A",
                        fontFamily: "Gellix",
                        fontSize: "16px",
                        fontWeight: 500
                    }}
                >
                    Endereço:
                </Typography>
                <Typography sx={{ color: "#1852FE", fontFamily: "Gellix", fontSize: "16px", fontWeight: 500 }}>
                    {paciente.endereco || "-"}
                </Typography>
            </Box>
            {/* Linha Cidade */}
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "8px" }}>
                <Box component="img" src="/cidade.svg" alt="Cidade" sx={{ width:"24px", height:"24px" }} />
                <Typography
                    sx={{
                        color: "#111E5A",
                        fontFamily: "Gellix",
                        fontSize: "16px",
                        fontWeight: 500
                    }}
                >
                    Cidade:
                </Typography>
                <Typography sx={{ color: "#1852FE", fontFamily: "Gellix", fontSize: "16px", fontWeight: 500 }}>
                    {paciente.cidade || "-"}
                </Typography>
            </Box>
            {/* Linha CEP */}
            <Box sx={{ display: "flex", alignItems: "center", gap: "8px", mb: "16px" }}>
                <Box component="img" src="/cep.svg" alt="CEP" sx={{ width:"24px", height:"24px" }} />
                <Typography
                    sx={{
                        color: "#111E5A",
                        fontFamily: "Gellix",
                        fontSize: "16px",
                        fontWeight: 500
                    }}
                >
                    CEP:
                </Typography>
                <Typography sx={{ color: "#1852FE", fontFamily: "Gellix", fontSize: "16px", fontWeight: 500 }}>
                    {paciente.cep || "-"}
                </Typography>
            </Box>
            {/* Seção "Cirurgias" */}
            <Typography
                sx={{
                    color: "#111E5A",
                    fontFamily: "Gellix",
                    fontSize: "14px",
                    fontWeight: 500,
                    opacity: 0.33,
                    mb: "16px"
                }}
            >
                Cirurgias
            </Typography>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                    gap: "8px",
                    mb: "42px"
                }}
            >
                {paciente.cirurgias && paciente.cirurgias.length > 0 ? (
                    paciente.cirurgias.map((item, idx) => (
                        <Box
                            key={idx}
                            sx={{
                                display: "inline-flex",
                                height: "40px",
                                padding: "12px 17px",
                                alignItems: "center",
                                gap: "10px",
                                borderRadius: "99px",
                                border: "1px solid #CED4DA",
                                color: "#111E5A",
                                fontFamily: "Gellix",
                                fontSize: "16px",
                                fontWeight: 500,
                                justifyContent: "center"
                            }}
                        >
                            {item}
                        </Box>
                    ))
                ) : (
                    <Box
                        sx={{
                            display: "inline-flex",
                            height: "40px",
                            padding: "12px 17px",
                            alignItems: "center",
                            gap: "10px",
                            borderRadius: "99px",
                            border: "1px solid #CED4DA",
                            color: "#111E5A",
                            fontFamily: "Gellix",
                            fontSize: "16px",
                            fontWeight: 500,
                            justifyContent: "center"
                        }}
                    >
                        -
                    </Box>
                )}
            </Box>
            {/* Seção "Alergias" */}
            <Typography
                sx={{
                    color: "#111E5A",
                    fontFamily: "Gellix",
                    fontSize: "14px",
                    fontWeight: 500,
                    opacity: 0.33,
                    mb: "16px"
                }}
            >
                Alergias
            </Typography>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                    gap: "8px",
                    mb: "42px"
                }}
            >
                {paciente.alergias && paciente.alergias.length > 0 ? (
                    paciente.alergias.map((item, idx) => (
                        <Box
                            key={idx}
                            sx={{
                                display: "inline-flex",
                                height: "40px",
                                padding: "12px 17px",
                                alignItems: "center",
                                gap: "10px",
                                borderRadius: "99px",
                                border: "1px solid #CED4DA",
                                color: "#111E5A",
                                fontFamily: "Gellix",
                                fontSize: "16px",
                                fontWeight: 500,
                                justifyContent: "center"
                            }}
                        >
                            {item}
                        </Box>
                    ))
                ) : (
                    <Box
                        sx={{
                            display: "inline-flex",
                            height: "40px",
                            padding: "12px 17px",
                            alignItems: "center",
                            gap: "10px",
                            borderRadius: "99px",
                            border: "1px solid #CED4DA",
                            color: "#111E5A",
                            fontFamily: "Gellix",
                            fontSize: "16px",
                            fontWeight: 500,
                            justifyContent: "center"
                        }}
                    >
                        -
                    </Box>
                )}
            </Box>
            {/* Seção "Atividade Física" */}
            <Typography
                sx={{
                    color: "#111E5A",
                    fontFamily: "Gellix",
                    fontSize: "14px",
                    fontWeight: 500,
                    opacity: 0.33,
                    mb: "16px"
                }}
            >
                Atividade Física
            </Typography>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                    gap: "8px",
                    mb: "42px"
                }}
            >
                {paciente.atividadeFisica && paciente.atividadeFisica.length > 0 ? (
                    paciente.atividadeFisica.map((item, idx) => (
                        <Box
                            key={idx}
                            sx={{
                                display: "inline-flex",
                                height: "40px",
                                padding: "12px 17px",
                                alignItems: "center",
                                gap: "10px",
                                borderRadius: "99px",
                                border: "1px solid #CED4DA",
                                color: "#111E5A",
                                fontFamily: "Gellix",
                                fontSize: "16px",
                                fontWeight: 500,
                                justifyContent: "center"
                            }}
                        >
                            {item}
                        </Box>
                    ))
                ) : (
                    <Box
                        sx={{
                            display: "inline-flex",
                            height: "40px",
                            padding: "12px 17px",
                            alignItems: "center",
                            gap: "10px",
                            borderRadius: "99px",
                            border: "1px solid #CED4DA",
                            color: "#111E5A",
                            fontFamily: "Gellix",
                            fontSize: "16px",
                            fontWeight: 500,
                            justifyContent: "center"
                        }}
                    >
                        -
                    </Box>
                )}
            </Box>
            {/* Seção "Histórico Doenças Genéticas" */}
            <Typography
                sx={{
                    color: "#111E5A",
                    fontFamily: "Gellix",
                    fontSize: "14px",
                    fontWeight: 500,
                    opacity: 0.33,
                    mb: "10px"
                }}
            >
                Histórico Doenças Genéticas
            </Typography>
            <Typography
                sx={{
                    color: "#111E5A",
                    fontFamily: "Gellix",
                    fontSize: "14px",
                    fontWeight: 500,
                    lineHeight: "150%"
                }}
            >
                {paciente.historicoDoencasGeneticas || "-"}
            </Typography>
        </Box>
    );
};

//
// COMPONENTE PRINCIPAL: CardPaciente
//
const CardPaciente = ({ paciente = exemploPaciente }) => {
    const [expanded, setExpanded] = useState(false);

    const handleToggle = () => {
        setExpanded((prev) => !prev);
    };

    return (
        <Box
            sx={{
                width: expanded ? "971px" : "380px",
                height: "817px",
                flexShrink: 0,
                borderRadius: "40px",
                border: expanded
                    ? "1px solid rgba(0, 0, 0, 0.10)"
                    : "1px solid #EAECEF",
                background: expanded ? "#F1F3FA" : "#FFF",
                opacity: expanded ? 0.44 : 1,
                display: "flex",
                position: "relative",
                boxSizing: "border-box",
                overflow: "hidden"
            }}
        >
            {/* Card1 – lado esquerdo, permanece estático */}
            <Card1 paciente={paciente} expanded={expanded} onToggle={handleToggle} />
            {/* Se estiver expandido, renderiza o Card2 à direita com 60px de distância */}
            {expanded && (
                <Box
                    sx={{
                        ml: "60px"
                    }}
                >
                    <Card2 paciente={paciente} />
                </Box>
            )}
        </Box>
    );
};

export default CardPaciente;
