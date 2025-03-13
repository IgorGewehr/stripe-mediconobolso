"use client";

import React, { useState } from 'react';
import {
    Box,
    Grid,
    FormControl,
    InputLabel,
    TextField,
    Select,
    MenuItem,
    RadioGroup,
    FormControlLabel,
    Radio,
    InputAdornment,
    FormLabel,
    Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Componentes estilizados
const StyledInputLabel = styled(InputLabel)({
    color: '#111E5A',
    fontFamily: 'Gellix, sans-serif',
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: '150%',
    transform: 'none',
    position: 'static',
    marginBottom: '8px',
    '&.Mui-focused': {
        color: '#111E5A',
    }
});

const StyledTextField = styled(TextField)({
    '& .MuiOutlinedInput-root': {
        borderRadius: '999px',
        '& fieldset': {
            borderColor: 'rgba(17, 30, 90, 0.30)'
        },
        '&:hover fieldset': {
            borderColor: 'rgba(17, 30, 90, 0.50)'
        },
        '&.Mui-focused fieldset': {
            borderColor: '#111E5A'
        }
    },
    '& .MuiInputBase-input': {
        padding: '12px 16px',
    }
});

const StyledSelect = styled(Select)({
    borderRadius: '999px',
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(17, 30, 90, 0.30)',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: 'rgba(17, 30, 90, 0.50)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#111E5A',
    }
});

const FormSectionContainer = styled(Box)({
    padding: '24px',
    width: '100%',
});

const InfoBasicasForm = () => {
    // Estados para os campos do formulário
    const [formData, setFormData] = useState({
        nomeCompleto: '',
        dataNascimento: '',
        tipoSanguineo: '',
        genero: 'masculino',
        endereco: '',
        cidade: '',
        estado: '',
        cpf: '',
        email: '',
        telefone: '',
        cep: ''
    });

    // Função para atualizar os dados do formulário
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    return (
        <FormSectionContainer>
            <Grid container spacing={3}>
                {/* Coluna Esquerda */}
                <Grid item xs={12} md={6}>
                    <Grid container spacing={3}>
                        {/* Nome Completo */}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <StyledInputLabel htmlFor="nomeCompleto">
                                    Nome Completo*
                                </StyledInputLabel>
                                <StyledTextField
                                    id="nomeCompleto"
                                    name="nomeCompleto"
                                    placeholder="Digite seu nome completo"
                                    value={formData.nomeCompleto}
                                    onChange={handleChange}
                                    fullWidth
                                />
                            </FormControl>
                        </Grid>

                        {/* Data de Nascimento */}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <StyledInputLabel htmlFor="dataNascimento">
                                    Data De Nascimento*
                                </StyledInputLabel>
                                <StyledTextField
                                    id="dataNascimento"
                                    name="dataNascimento"
                                    placeholder="DD/MM/AAAA"
                                    value={formData.dataNascimento}
                                    onChange={handleChange}
                                    fullWidth
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <img src="/nascimento.svg" alt="Calendário" style={{ width: '20px', height: '20px' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </FormControl>
                        </Grid>

                        {/* Tipo Sanguíneo */}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <StyledInputLabel htmlFor="tipoSanguineo">
                                    Tipo Sanguíneo*
                                </StyledInputLabel>
                                <StyledSelect
                                    id="tipoSanguineo"
                                    name="tipoSanguineo"
                                    value={formData.tipoSanguineo}
                                    onChange={handleChange}
                                    displayEmpty
                                    renderValue={selected => selected || "Selecione um..."}
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

                        {/* Gênero */}
                        <Grid item xs={12} sm={6}>
                            <FormControl component="fieldset" fullWidth>
                                <FormLabel
                                    sx={{
                                        color: '#111E5A !important',
                                        fontFamily: 'Gellix, sans-serif',
                                        fontSize: '16px',
                                        fontWeight: 500,
                                        lineHeight: '150%',
                                        marginBottom: '8px',
                                    }}
                                >
                                    Gênero*
                                </FormLabel>
                                <RadioGroup
                                    row
                                    name="genero"
                                    value={formData.genero}
                                    onChange={handleChange}
                                >
                                    <FormControlLabel
                                        value="masculino"
                                        control={
                                            <Radio
                                                sx={{
                                                    '&.Mui-checked': {
                                                        color: '#111E5A',
                                                    },
                                                }}
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <img
                                                    src="/gMasculino.svg"
                                                    alt="Masculino"
                                                    style={{ marginRight: 8, width: '20px', height: '20px' }}
                                                />
                                                <Typography
                                                    sx={{
                                                        fontFamily: 'Gellix, sans-serif',
                                                        fontSize: '14px',
                                                    }}
                                                >
                                                    Masculino
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                    <FormControlLabel
                                        value="feminino"
                                        control={
                                            <Radio
                                                sx={{
                                                    '&.Mui-checked': {
                                                        color: '#111E5A',
                                                    },
                                                }}
                                            />
                                        }
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <img
                                                    src="/gFeminino.svg"
                                                    alt="Feminino"
                                                    style={{ marginRight: 8, width: '20px', height: '20px' }}
                                                />
                                                <Typography
                                                    sx={{
                                                        fontFamily: 'Gellix, sans-serif',
                                                        fontSize: '14px',
                                                    }}
                                                >
                                                    Feminino
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </RadioGroup>
                            </FormControl>
                        </Grid>

                        {/* Endereço */}
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <StyledInputLabel htmlFor="endereco">
                                    Endereço
                                </StyledInputLabel>
                                <StyledTextField
                                    id="endereco"
                                    name="endereco"
                                    placeholder="Digite seu endereço"
                                    value={formData.endereco}
                                    onChange={handleChange}
                                    fullWidth
                                />
                            </FormControl>
                        </Grid>

                        {/* Cidade e Estado */}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <StyledInputLabel htmlFor="cidade">
                                    Cidade
                                </StyledInputLabel>
                                <StyledSelect
                                    id="cidade"
                                    name="cidade"
                                    value={formData.cidade}
                                    onChange={handleChange}
                                    displayEmpty
                                    renderValue={selected => selected || "Selecione uma..."}
                                >
                                    <MenuItem value="" disabled>
                                        Selecione uma...
                                    </MenuItem>
                                    <MenuItem value="sao_paulo">São Paulo</MenuItem>
                                    <MenuItem value="rio_de_janeiro">Rio de Janeiro</MenuItem>
                                    <MenuItem value="belo_horizonte">Belo Horizonte</MenuItem>
                                    <MenuItem value="fortaleza">Fortaleza</MenuItem>
                                </StyledSelect>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <StyledInputLabel htmlFor="estado">
                                    Estado
                                </StyledInputLabel>
                                <StyledSelect
                                    id="estado"
                                    name="estado"
                                    value={formData.estado}
                                    onChange={handleChange}
                                    displayEmpty
                                    renderValue={selected => selected || "Selecione um..."}
                                >
                                    <MenuItem value="" disabled>
                                        Selecione um...
                                    </MenuItem>
                                    <MenuItem value="SP">São Paulo</MenuItem>
                                    <MenuItem value="RJ">Rio de Janeiro</MenuItem>
                                    <MenuItem value="MG">Minas Gerais</MenuItem>
                                    <MenuItem value="CE">Ceará</MenuItem>
                                </StyledSelect>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Grid>

                {/* Coluna Direita */}
                <Grid item xs={12} md={6}>
                    <Grid container spacing={3}>
                        {/* CPF */}
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <StyledInputLabel htmlFor="cpf">
                                    CPF
                                </StyledInputLabel>
                                <StyledTextField
                                    id="cpf"
                                    name="cpf"
                                    placeholder="000.000.000-00"
                                    value={formData.cpf}
                                    onChange={handleChange}
                                    fullWidth
                                />
                            </FormControl>
                        </Grid>

                        {/* Email */}
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <StyledInputLabel htmlFor="email">
                                    Email*
                                </StyledInputLabel>
                                <StyledTextField
                                    id="email"
                                    name="email"
                                    placeholder="contato@email.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    fullWidth
                                />
                            </FormControl>
                        </Grid>

                        {/* Telefone */}
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <StyledInputLabel htmlFor="telefone">
                                    Telefone*
                                </StyledInputLabel>
                                <StyledTextField
                                    id="telefone"
                                    name="telefone"
                                    placeholder="(00) 00000-0000"
                                    value={formData.telefone}
                                    onChange={handleChange}
                                    fullWidth
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <img src="/telefone.svg" alt="Telefone" style={{ width: '20px', height: '20px' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </FormControl>
                        </Grid>

                        {/* CEP */}
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <StyledInputLabel htmlFor="cep">
                                    CEP
                                </StyledInputLabel>
                                <StyledTextField
                                    id="cep"
                                    name="cep"
                                    placeholder="00000-000"
                                    value={formData.cep}
                                    onChange={handleChange}
                                    fullWidth
                                />
                            </FormControl>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </FormSectionContainer>
    );
};

export default InfoBasicasForm;