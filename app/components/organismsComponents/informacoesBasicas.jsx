"use client";

import React, { useState } from "react";
import {
    Box,
    Grid,
    Typography,
    TextField,
    Select,
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
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';

// ------------------ ESTILOS ------------------
const FormLabel = styled(Typography)(() => ({
    color: "#111E5A",
    fontWeight: 500,
    fontSize: "14px",
    marginBottom: "8px",
}));

const StyledTextField = styled(TextField)(() => ({
    "& .MuiOutlinedInput-root": {
        borderRadius: "999px",
        backgroundColor: "#FFFFFF",
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

const StyledSelect = styled(Select)(() => ({
    borderRadius: "999px",
    backgroundColor: "#FFFFFF",
    "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(17, 30, 90, 0.30)",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: "rgba(17, 30, 90, 0.50)",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "#111E5A",
    },
    "& .MuiSelect-select": {
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

function InfoBasicasForm({ formData, updateFormData, errors = {} }) {
    const [photoPreview, setPhotoPreview] = useState(null);

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
                updateFormData({ foto: file });
            };

            reader.readAsDataURL(file);
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Grid container spacing={3}>
                {/* Foto do Paciente */}
                <Grid item xs={12}>
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
                </Grid>

                {/* Nome Completo */}
                <Grid item xs={12} md={6}>
                    <FormLabel>Nome Completo*</FormLabel>
                    <StyledTextField
                        fullWidth
                        id="nome"
                        name="nome"
                        placeholder="Digite seu nome completo"
                        value={formData.nome || ""}
                        onChange={handleChange}
                        error={!!errors.nome}
                        helperText={errors.nome}
                        variant="outlined"
                    />
                </Grid>

                {/* Data de Nascimento */}
                <Grid item xs={12} md={6}>
                    <FormLabel>Data De Nascimento*</FormLabel>
                    <StyledTextField
                        fullWidth
                        id="dataNascimento"
                        name="dataNascimento"
                        placeholder="dd/mm/aaaa"
                        value={formData.dataNascimento || ""}
                        onChange={handleChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <CalendarTodayIcon sx={{ color: "#9CA3AF" }} />
                                </InputAdornment>
                            ),
                        }}
                        error={!!errors.dataNascimento}
                        helperText={errors.dataNascimento}
                        variant="outlined"
                    />
                </Grid>

                {/* Tipo Sanguíneo */}
                <Grid item xs={12} md={6}>
                    <FormLabel>Tipo Sanguíneo*</FormLabel>
                    <FormControl fullWidth>
                        <StyledSelect
                            id="tipoSanguineo"
                            name="tipoSanguineo"
                            value={formData.tipoSanguineo || ""}
                            onChange={handleChange}
                            displayEmpty
                            renderValue={(selected) => {
                                if (!selected) return "Selecione um...";
                                return selected;
                            }}
                        >
                            <MenuItem value="" disabled>Selecione um...</MenuItem>
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

                {/* Gênero */}
                <Grid item xs={12} md={6}>
                    <FormLabel>Gênero*</FormLabel>
                    <Grid container spacing={2}>
                        <Grid item xs={6}>
                            <GenderButton
                                onClick={() => handleGenderChange("masculino")}
                                selected={formData.genero === "masculino"}
                                startIcon={<MaleIcon />}
                            >
                                Masculino
                            </GenderButton>
                        </Grid>
                        <Grid item xs={6}>
                            <GenderButton
                                onClick={() => handleGenderChange("feminino")}
                                selected={formData.genero === "feminino"}
                                startIcon={<FemaleIcon />}
                            >
                                Feminino
                            </GenderButton>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Email */}
                <Grid item xs={12} md={6}>
                    <FormLabel>Email*</FormLabel>
                    <StyledTextField
                        fullWidth
                        id="email"
                        name="email"
                        placeholder="contato@paciente.com"
                        value={formData.email || ""}
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

                {/* Telefone */}
                <Grid item xs={12} md={6}>
                    <FormLabel>Telefone*</FormLabel>
                    <StyledTextField
                        fullWidth
                        id="telefone"
                        name="telefone"
                        placeholder="(00) 00000-0000"
                        value={formData.telefone || ""}
                        onChange={handleChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PhoneIcon sx={{ color: "#9CA3AF" }} />
                                </InputAdornment>
                            ),
                        }}
                        error={!!errors.telefone}
                        helperText={errors.telefone}
                        variant="outlined"
                    />
                </Grid>

                {/* Endereço e CPF */}
                <Grid item xs={12} container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <FormLabel>Endereço</FormLabel>
                        <StyledTextField
                            fullWidth
                            id="endereco"
                            name="endereco"
                            placeholder="Digite seu endereço"
                            value={formData.endereco || ""}
                            onChange={handleChange}
                            variant="outlined"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormLabel>CPF</FormLabel>
                        <StyledTextField
                            fullWidth
                            id="cpf"
                            name="cpf"
                            placeholder="000-000-000-00"
                            value={formData.cpf || ""}
                            onChange={handleChange}
                            variant="outlined"
                        />
                    </Grid>
                </Grid>

                {/* Cidade, Estado e CEP */}
                <Grid item xs={12} container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl fullWidth>
                            <StyledSelect
                                id="cidade"
                                name="cidade"
                                value={formData.cidade || ""}
                                onChange={handleChange}
                                displayEmpty
                                renderValue={(selected) => {
                                    if (!selected) return "Selecione um...";
                                    return selected;
                                }}
                            >
                                <MenuItem value="" disabled>Selecione um...</MenuItem>
                                {/* Opções de cidades aqui */}
                            </StyledSelect>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <FormLabel>Estado</FormLabel>
                        <FormControl fullWidth>
                            <StyledSelect
                                id="estado"
                                name="estado"
                                value={formData.estado || ""}
                                onChange={handleChange}
                                displayEmpty
                                renderValue={(selected) => {
                                    if (!selected) return "Selecione um...";
                                    return selected;
                                }}
                            >
                                <MenuItem value="" disabled>Selecione um...</MenuItem>
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

                    <Grid item xs={12} md={4}>
                        <FormLabel>CEP</FormLabel>
                        <StyledTextField
                            fullWidth
                            id="cep"
                            name="cep"
                            placeholder="00000-000"
                            value={formData.cep || ""}
                            onChange={handleChange}
                            variant="outlined"
                        />
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
}

export default InfoBasicasForm;