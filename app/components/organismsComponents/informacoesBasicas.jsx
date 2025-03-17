"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Grid,
    Typography,
    TextField,
    MenuItem,
    FormControl,
    styled,
    Button,
    Avatar,
    InputAdornment,
} from "@mui/material";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import MaleIcon from "@mui/icons-material/Male";
import FemaleIcon from "@mui/icons-material/Female";

// ------------------ ESTILOS ------------------
const FormLabel = styled(Typography)(() => ({
    color: "#111E5A",
    fontWeight: 500,
    fontSize: "14px",
    marginBottom: "8px",
}));

// Aplica o border-radius e borda para todos os campos
const StyledTextField = styled(TextField)(() => ({
    "& .MuiOutlinedInput-root": {
        borderRadius: "999px",
        backgroundColor: "#FFFFFF",
        "& fieldset": {
            border: "1px solid rgba(17, 30, 90, 0.30)",
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

// Mesmo estilo para os selects
const StyledSelect = styled(TextField)(() => ({
    "& .MuiOutlinedInput-root": {
        borderRadius: "999px",
        backgroundColor: "#FFFFFF",
        "& fieldset": {
            border: "1px solid rgba(17, 30, 90, 0.30)",
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

const GenderButton = styled(Button)(({ selected }) => ({
    borderRadius: "999px",
    backgroundColor: selected ? "#E8EAF6" : "#FFFFFF",
    border: `1px solid ${selected ? "#111E5A" : "rgba(17, 30, 90, 0.30)"}`,
    color: "#111E5A",
    textTransform: "none",
    padding: "10px 16px",
    "&:hover": {
        backgroundColor: selected ? "#E8EAF6" : "#F9FAFB",
        borderColor: selected ? "#111E5A" : "#D1D5DB",
    },
    width: "100%",
    justifyContent: "flex-start",
}));

const PhotoUploadButton = styled(Button)(() => ({
    borderRadius: "16px",
    border: "1px dashed rgba(17, 30, 90, 0.30)",
    backgroundColor: "#FFFFFF",
    color: "#111E5A",
    textTransform: "none",
    padding: "12px 16px",
    "&:hover": {
        backgroundColor: "#F9FAFB",
        borderColor: "#D1D5DB",
    },
    width: "100%",
    height: "100px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
}));

// Formata o valor digitado no campo de data de nascimento.
// Ex.: "19122001" => "19/12/2001"
const formatBirthDate = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    let formatted = "";
    if (digits.length > 0) {
        formatted = digits.substring(0, 2);
    }
    if (digits.length >= 3) {
        formatted += "/" + digits.substring(2, 4);
    }
    if (digits.length >= 5) {
        formatted += "/" + digits.substring(4, 8);
    }
    return formatted;
};

function InfoBasicasForm({ formData = {}, updateFormData, errors = {}, resetTrigger }) {
    const [photoPreview, setPhotoPreview] = useState(null);

    // Adicione este useEffect para resetar o photoPreview quando resetTrigger mudar
    useEffect(() => {
        if (resetTrigger > 0) {
            setPhotoPreview(null);
        }
    }, [resetTrigger]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        updateFormData({ [name]: value });
    };

    const handleGenderChange = (gender) => {
        updateFormData({ genero: gender });
    };

    const handlePhotoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                setPhotoPreview(event.target.result);
                updateFormData({ patientPhoto: file });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBirthDateChange = (e) => {
        const { value } = e.target;
        const formatted = formatBirthDate(value);
        updateFormData({ dataNascimento: formatted });
    };

    // Funções manuais para formatação dos demais campos
    const formatCPF = (value) => {
        const digits = value.replace(/\D/g, "").slice(0, 11);
        let formatted = digits.substring(0, Math.min(3, digits.length));
        if (digits.length >= 4) {
            formatted += "." + digits.substring(3, Math.min(6, digits.length));
        }
        if (digits.length >= 7) {
            formatted += "." + digits.substring(6, Math.min(9, digits.length));
        }
        if (digits.length >= 10) {
            formatted += "-" + digits.substring(9, Math.min(11, digits.length));
        }
        return formatted;
    };

    const handleCPFChange = (e) => {
        updateFormData({ cpf: formatCPF(e.target.value) });
    };

    const formatTelefone = (value) => {
        const digits = value.replace(/\D/g, "").slice(0, 11);
        let formatted = "";
        if (digits.length > 0) {
            formatted = "(" + digits.substring(0, Math.min(2, digits.length));
        }
        if (digits.length >= 3) {
            formatted += ") " + digits.substring(2, Math.min(7, digits.length));
        }
        if (digits.length >= 8) {
            formatted += "-" + digits.substring(7, Math.min(11, digits.length));
        }
        return formatted;
    };

    const handleTelefoneChange = (e) => {
        updateFormData({ telefone: formatTelefone(e.target.value) });
    };

    const formatCEP = (value) => {
        const digits = value.replace(/\D/g, "").slice(0, 8);
        let formatted = digits.substring(0, Math.min(5, digits.length));
        if (digits.length > 5) {
            formatted += "-" + digits.substring(5, Math.min(8, digits.length));
        }
        return formatted;
    };

    const handleCEPChange = (e) => {
        updateFormData({ cep: formatCEP(e.target.value) });
    };

    return (
        <Box sx={{ p: 2 }}>
            {/* Foto do Paciente */}
            <Box sx={{ mb: 3 }}>
                <FormLabel>Foto do Paciente</FormLabel>
                <input
                    type="file"
                    accept="image/*"
                    id="foto-paciente"
                    style={{ display: "none" }}
                    onChange={handlePhotoChange}
                />
                <label htmlFor="foto-paciente">
                    {photoPreview ? (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar
                                src={photoPreview}
                                alt="Foto do paciente"
                                sx={{ width: 80, height: 80, mr: 2 }}
                            />
                            <Button
                                variant="outlined"
                                color="primary"
                                startIcon={<AddPhotoAlternateIcon />}
                                sx={{
                                    borderRadius: "999px",
                                    textTransform: "none",
                                    border: "1px solid rgba(17, 30, 90, 0.30)",
                                    color: "#111E5A",
                                }}
                            >
                                Alterar foto
                            </Button>
                        </Box>
                    ) : (
                        <PhotoUploadButton component="span">
                            <AddPhotoAlternateIcon sx={{ fontSize: 24, mb: 1 }} />
                            <Typography variant="body2">
                                Clique para adicionar uma foto
                            </Typography>
                        </PhotoUploadButton>
                    )}
                </label>
            </Box>

            <Grid container spacing={2}>
                {/* PRIMEIRA LINHA: Nome, Email e Telefone */}
                <Grid item xs={12} sm={4}>
                    <FormLabel>Nome Completo*</FormLabel>
                    <StyledTextField
                        fullWidth
                        id="nome"
                        name="nome"
                        placeholder="Digite seu nome completo"
                        value={formData?.nome || ""}
                        onChange={handleChange}
                        error={!!errors.nome}
                        helperText={errors.nome}
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormLabel>Email*</FormLabel>
                    <StyledTextField
                        fullWidth
                        id="email"
                        name="email"
                        placeholder="contato@paciente.com"
                        value={formData?.email || ""}
                        onChange={handleChange}
                        error={!!errors.email}
                        helperText={errors.email}
                        variant="outlined"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EmailIcon sx={{ color: "#9CA3AF" }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormLabel>Telefone*</FormLabel>
                    <StyledTextField
                        fullWidth
                        id="telefone"
                        name="telefone"
                        placeholder="(00) 00000-0000"
                        value={formData?.telefone || ""}
                        onChange={handleTelefoneChange}
                        error={!!errors.telefone}
                        helperText={errors.telefone}
                        variant="outlined"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PhoneIcon sx={{ color: "#9CA3AF" }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>

                {/* SEGUNDA LINHA: Tipo Sanguíneo, Gênero e Data de Nascimento */}
                <Grid item xs={12} sm={4}>
                    <FormLabel>Tipo Sanguíneo*</FormLabel>
                    <FormControl fullWidth>
                        <StyledSelect
                            select
                            id="tipoSanguineo"
                            name="tipoSanguineo"
                            value={formData?.tipoSanguineo || ""}
                            onChange={handleChange}
                            error={!!errors.tipoSanguineo}
                        >
                            <MenuItem value="" disabled>
                                Selecione um...
                            </MenuItem>
                            <MenuItem value="A+">A+</MenuItem>
                            <MenuItem value="A-">A-</MenuItem>
                            <MenuItem value="B+">B+</MenuItem>
                            <MenuItem value="B-">B-</MenuItem>
                            <MenuItem value="AB+">AB+</MenuItem>
                            <MenuItem value="AB-">AB-</MenuItem>
                            <MenuItem value="O+">O+</MenuItem>
                            <MenuItem value="O-">O-</MenuItem>
                        </StyledSelect>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormLabel>Gênero*</FormLabel>
                    <Grid container spacing={1}>
                        <Grid item xs={6}>
                            <GenderButton
                                onClick={() => handleGenderChange("masculino")}
                                selected={formData?.genero === "masculino"}
                                startIcon={<MaleIcon />}
                            >
                                Masculino
                            </GenderButton>
                        </Grid>
                        <Grid item xs={6}>
                            <GenderButton
                                onClick={() => handleGenderChange("feminino")}
                                selected={formData?.genero === "feminino"}
                                startIcon={<FemaleIcon />}
                            >
                                Feminino
                            </GenderButton>
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormLabel>Data de Nascimento*</FormLabel>
                    <StyledTextField
                        fullWidth
                        id="dataNascimento"
                        name="dataNascimento"
                        placeholder="DD/MM/AAAA"
                        value={formData?.dataNascimento || ""}
                        onChange={handleBirthDateChange}
                        error={!!errors.dataNascimento}
                        helperText={errors.dataNascimento}
                        variant="outlined"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <CalendarTodayIcon sx={{ color: "#9CA3AF" }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Grid>

                {/* TERCEIRA LINHA: Endereço e CPF */}
                <Grid item xs={12} sm={6}>
                    <FormLabel>Endereço</FormLabel>
                    <StyledTextField
                        fullWidth
                        id="endereco"
                        name="endereco"
                        placeholder="Digite seu endereço"
                        value={formData?.endereco || ""}
                        onChange={handleChange}
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormLabel>CPF</FormLabel>
                    <StyledTextField
                        fullWidth
                        id="cpf"
                        name="cpf"
                        placeholder="000.000.000-00"
                        value={formData?.cpf || ""}
                        onChange={handleCPFChange}
                        variant="outlined"
                    />
                </Grid>

                {/* QUARTA LINHA: Cidade, Estado e CEP */}
                <Grid item xs={12} sm={4}>
                    <FormLabel>Cidade</FormLabel>
                    <StyledTextField
                        fullWidth
                        id="cidade"
                        name="cidade"
                        placeholder="Digite o nome da cidade"
                        value={formData?.cidade || ""}
                        onChange={handleChange}
                        variant="outlined"
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormLabel>Estado</FormLabel>
                    <FormControl fullWidth>
                        <StyledSelect
                            select
                            id="estado"
                            name="estado"
                            value={formData?.estado || ""}
                            onChange={handleChange}
                        >
                            <MenuItem value="" disabled>
                                Selecione um...
                            </MenuItem>
                            <MenuItem value="AC">Acre</MenuItem>
                            <MenuItem value="AL">Alagoas</MenuItem>
                            <MenuItem value="AP">Amapá</MenuItem>
                            <MenuItem value="AM">Amazonas</MenuItem>
                            <MenuItem value="BA">Bahia</MenuItem>
                            <MenuItem value="CE">Ceará</MenuItem>
                            <MenuItem value="DF">Distrito Federal</MenuItem>
                            <MenuItem value="ES">Espírito Santo</MenuItem>
                            <MenuItem value="GO">Goiás</MenuItem>
                            <MenuItem value="MA">Maranhão</MenuItem>
                            <MenuItem value="MT">Mato Grosso</MenuItem>
                            <MenuItem value="MS">Mato Grosso do Sul</MenuItem>
                            <MenuItem value="MG">Minas Gerais</MenuItem>
                            <MenuItem value="PA">Pará</MenuItem>
                            <MenuItem value="PB">Paraíba</MenuItem>
                            <MenuItem value="PR">Paraná</MenuItem>
                            <MenuItem value="PE">Pernambuco</MenuItem>
                            <MenuItem value="PI">Piauí</MenuItem>
                            <MenuItem value="RJ">Rio de Janeiro</MenuItem>
                            <MenuItem value="RN">Rio Grande do Norte</MenuItem>
                            <MenuItem value="RS">Rio Grande do Sul</MenuItem>
                            <MenuItem value="RO">Rondônia</MenuItem>
                            <MenuItem value="RR">Roraima</MenuItem>
                            <MenuItem value="SC">Santa Catarina</MenuItem>
                            <MenuItem value="SP">São Paulo</MenuItem>
                            <MenuItem value="SE">Sergipe</MenuItem>
                            <MenuItem value="TO">Tocantins</MenuItem>
                        </StyledSelect>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormLabel>CEP</FormLabel>
                    <StyledTextField
                        fullWidth
                        id="cep"
                        name="cep"
                        placeholder="00000-000"
                        value={formData?.cep || ""}
                        onChange={handleCEPChange}
                        variant="outlined"
                    />
                </Grid>
            </Grid>
        </Box>
    );
}

export default InfoBasicasForm;
