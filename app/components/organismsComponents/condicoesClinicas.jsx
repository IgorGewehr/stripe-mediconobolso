"use client";

import React, { useState } from "react";
import {
    Box,
    Typography,
    TextField,
    Button,
    InputAdornment,
    Chip,
    IconButton,
    styled,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

// ------------------ ESTILOS ------------------
const SectionLabel = styled(Typography)(() => ({
    color: "#111E5A",
    fontWeight: 500,
    fontSize: "14px",
    marginBottom: "8px",
}));

const StyledTextField = styled(TextField)(() => ({
    "& .MuiOutlinedInput-root": {
        borderRadius: "999px",
        "& fieldset": {
            borderColor: "rgba(17, 30, 90, 0.30)",
        },
        "&:hover fieldset": {
            borderColor: "rgba(17, 30, 90, 0.50)",
        },
        "&.Mui-focused fieldset": {
            borderColor: "#111E5A",
        },
    },
    "& .MuiInputBase-input": {
        padding: "12px 16px",
    },
}));

// Alterado para um botão retangular com label "Adicionar"
const AddButton = styled(Button)(({ theme }) => ({
    backgroundColor: "#3366FF",
    color: "white",
    padding: "6px 12px",
    borderRadius: "4px", // formato retangular
    textTransform: "none",
    fontWeight: 500,
    fontSize: "0.875rem",
    minWidth: "100px",
    "&:hover": {
        backgroundColor: "#2952CC",
    },
}));

const StyledChip = styled(Chip, {
    shouldForwardProp: (prop) => prop !== "bgColor",
})(({ bgColor }) => ({
    borderRadius: "999px",
    backgroundColor: bgColor,
    height: "32px",
    margin: "4px",
    fontWeight: 500,
    "& .MuiChip-deleteIcon": {
        color: "rgba(0, 0, 0, 0.6)",
        "&:hover": {
            color: "rgba(0, 0, 0, 0.8)",
        },
    },
}));

const ToggleButton = styled(Button)(({ selected }) => ({
    borderRadius: "999px",
    backgroundColor: selected ? "#3366FF" : "#F0F2F5",
    color: selected ? "white" : "#111E5A",
    fontWeight: 500,
    padding: "8px 16px",
    textTransform: "none",
    minWidth: "80px",
    marginRight: "8px",
    boxShadow: "none",
    "&:hover": {
        backgroundColor: selected ? "#2952CC" : "#E0E2E5",
        boxShadow: "none",
    },
}));

// Cores dos chips para cada categoria
const ChipColors = {
    medicamentos: "#E3F2FD", // Azul claro
    doencas: {
        Diabetes: "#FFF9C4", // Amarelo
        Fumante: "#E0F7FA", // Ciano
        Internado: "#E8EAF6", // Lavanda
        default: "#FFF9C4",
    },
    alergias: {
        Poeira: "#F5F5F5", // Cinza
        Amoxilina: "#F5F5F5", // Cinza
        default: "#F5F5F5",
    },
    cirurgias: "#E8F5E9", // Verde claro
    atividades: "#E0F7FA", // Ciano claro
};

// -------------------------------------------------

const CondicoesClinicasForm = ({ formData, updateFormData }) => {
    const [inputValues, setInputValues] = useState({
        medicamentos: "",
        doencas: "",
        alergias: "",
        cirurgias: "",
        atividades: "",
    });

    // Atualiza valor do campo
    const handleInputChange = (e, type) => {
        setInputValues({
            ...inputValues,
            [type]: e.target.value,
        });
    };

    // Adiciona item à lista
    const addItem = (type) => {
        if (inputValues[type].trim() !== "") {
            const updatedItems = [...(formData[type] || []), inputValues[type].trim()];
            updateFormData({ [type]: updatedItems });
            setInputValues({
                ...inputValues,
                [type]: "",
            });
        }
    };

    // Remove item da lista
    const removeItem = (type, index) => {
        const updatedItems = formData[type].filter((_, i) => i !== index);
        updateFormData({ [type]: updatedItems });
    };

    // Enter para adicionar
    const handleKeyPress = (e, type) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addItem(type);
        }
    };

    // Seleciona cor do chip baseado no tipo e no valor
    const getChipColor = (type, value) => {
        if (typeof ChipColors[type] === "object") {
            return ChipColors[type][value] || ChipColors[type].default;
        }
        return ChipColors[type];
    };

    // Gerencia estados de toggle (álcool e fumante)
    const handleToggle = (field, value) => {
        updateFormData({ [field]: value });
    };

    // Render para cada seção de itens
    const renderItemSection = (title, type, placeholder) => (
        <Box sx={{ mb: 3 }}>
            <SectionLabel>{title}</SectionLabel>
            <StyledTextField
                fullWidth
                placeholder={placeholder}
                value={inputValues[type]}
                onChange={(e) => handleInputChange(e, type)}
                onKeyPress={(e) => handleKeyPress(e, type)}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <AddButton
                                onClick={() => addItem(type)}
                                startIcon={<AddIcon fontSize="small" />}
                                variant="contained"
                            >
                                Adicionar
                            </AddButton>
                        </InputAdornment>
                    ),
                }}
            />
            <Box sx={{ display: "flex", flexWrap: "wrap", mt: 1 }}>
                {(formData[type] || []).map((item, index) => (
                    <StyledChip
                        key={index}
                        label={item}
                        bgColor={getChipColor(type, item)}
                        onDelete={() => removeItem(type, index)}
                        deleteIcon={<CloseIcon style={{ fontSize: "16px" }} />}
                    />
                ))}
            </Box>
        </Box>
    );

    // Render para botões de toggle
    const renderToggleSection = (title, field) => (
        <Box sx={{ mb: 3 }}>
            <SectionLabel>{title}</SectionLabel>
            <Box sx={{ display: "flex", mt: 1 }}>
                <ToggleButton
                    selected={formData[field] === "Sim"}
                    onClick={() => handleToggle(field, "Sim")}
                    variant="contained"
                    disableElevation
                >
                    Sim
                </ToggleButton>
                <ToggleButton
                    selected={formData[field] === "Não"}
                    onClick={() => handleToggle(field, "Não")}
                    variant="contained"
                    disableElevation
                >
                    Não
                </ToggleButton>
            </Box>
        </Box>
    );

    return (
        <Box component="form" autoComplete="off" sx={{ p: 2 }}>
            {renderItemSection("Medicamentos", "medicamentos", "Digite o medicamento")}
            {renderItemSection("Doenças", "doencas", "Digite a doença")}
            {renderItemSection("Alergias", "alergias", "Digite a alergia")}
            {renderItemSection("Cirurgias", "cirurgias", "Digite a cirurgia")}
            {renderItemSection("Atividade Física", "atividades", "Digite a atividade")}

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                {renderToggleSection("Consome Álcool?", "consumeAlcool")}
                {renderToggleSection("É fumante?", "ehFumante")}
            </Box>
        </Box>
    );
};

export default CondicoesClinicasForm;
