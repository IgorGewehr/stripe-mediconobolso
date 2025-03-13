"use client";

import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    IconButton,
    Chip,
    ToggleButton,
    ToggleButtonGroup,
    Grid,
    FormControl,
    FormLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { styled } from '@mui/material/styles';

// Componentes estilizados
const SectionTitle = styled(Typography)({
    color: '#111E5A',
    fontFamily: 'Gellix, sans-serif',
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: '24px',
    textTransform: 'uppercase',
    marginBottom: '12px',
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

const AddButton = styled(IconButton)({
    backgroundColor: '#111E5A',
    color: 'white',
    '&:hover': {
        backgroundColor: '#0A144A',
    },
    width: '36px',
    height: '36px',
});

const ChipColors = {
    medicamentos: '#E3F2FD',  // Azul claro
    doencas: '#FFF9C4',       // Amarelo
    alergias: '#F5F5F5',      // Cinza claro
    cirurgias: '#E8F5E9',     // Verde claro
    atividades: '#E0F7FA',    // Ciano claro
};

const StyledToggleButtonGroup = styled(ToggleButtonGroup)({
    '& .MuiToggleButtonGroup-grouped': {
        borderRadius: '20px',
        margin: '0 8px',
        border: '1px solid #EAECEF',
        '&.Mui-selected': {
            backgroundColor: '#111E5A',
            color: 'white',
            borderColor: '#111E5A',
            '&:hover': {
                backgroundColor: '#0A144A',
            },
        },
        '&:not(.Mui-selected)': {
            backgroundColor: '#EAECEF',
            color: '#111E5A',
            '&:hover': {
                backgroundColor: '#D0D4D9',
            },
        },
    },
});

const FormSectionContainer = styled(Box)({
    padding: '24px',
    width: '100%',
});

const CondicoesClinicasForm = () => {
    // Estados para cada seção de texto
    const [inputValues, setInputValues] = useState({
        medicamentos: '',
        doencas: '',
        alergias: '',
        cirurgias: '',
        atividades: '',
    });

    const [items, setItems] = useState({
        medicamentos: [],
        doencas: [],
        alergias: [],
        cirurgias: [],
        atividades: [],
    });

    // Estados para perguntas binárias
    const [consumeAlcool, setConsumeAlcool] = useState('Não');
    const [ehFumante, setEhFumante] = useState('Não');

    // Função para atualizar os inputs
    const handleInputChange = (e, type) => {
        setInputValues({
            ...inputValues,
            [type]: e.target.value,
        });
    };

    // Função para adicionar itens às listas
    const addItem = (type) => {
        if (inputValues[type].trim() !== '') {
            setItems({
                ...items,
                [type]: [...items[type], inputValues[type].trim()],
            });
            setInputValues({
                ...inputValues,
                [type]: '',
            });
        }
    };

    // Função para remover itens das listas
    const removeItem = (type, index) => {
        setItems({
            ...items,
            [type]: items[type].filter((_, i) => i !== index),
        });
    };

    // Função para lidar com a mudança nos botões de toggle
    const handleToggleChange = (type, event, newValue) => {
        if (newValue !== null) {
            if (type === 'alcool') {
                setConsumeAlcool(newValue);
            } else if (type === 'fumante') {
                setEhFumante(newValue);
            }
        }
    };

    // Helper para renderizar as seções de itens
    const renderItemSection = (title, type) => (
        <Box sx={{ mb: 3 }}>
            <SectionTitle>{title}</SectionTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: 1 }}>
                <StyledTextField
                    value={inputValues[type]}
                    onChange={(e) => handleInputChange(e, type)}
                    placeholder={`Digite ${type === 'medicamentos' ? 'o' : type === 'doencas' ? 'a' : 'a'} ${title.toLowerCase().slice(0, -1)}`}
                    fullWidth
                    size="small"
                />
                <AddButton onClick={() => addItem(type)} aria-label={`Adicionar ${title}`}>
                    <AddIcon />
                </AddButton>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', mt: 1 }}>
                {items[type].map((item, index) => (
                    <Chip
                        key={index}
                        label={item}
                        onDelete={() => removeItem(type, index)}
                        sx={{
                            backgroundColor: ChipColors[type],
                            color: '#111E5A',
                            borderRadius: '16px',
                            '& .MuiChip-deleteIcon': {
                                color: '#111E5A',
                                '&:hover': {
                                    color: '#0A144A',
                                },
                            },
                        }}
                    />
                ))}
            </Box>
        </Box>
    );

    return (
        <FormSectionContainer>
            <Grid container spacing={3}>
                {/* Coluna Esquerda */}
                <Grid item xs={12} md={6}>
                    {renderItemSection('Medicamentos', 'medicamentos')}
                    {renderItemSection('Doenças', 'doencas')}
                    {renderItemSection('Alergias', 'alergias')}
                </Grid>

                {/* Coluna Direita */}
                <Grid item xs={12} md={6}>
                    {renderItemSection('Cirurgias', 'cirurgias')}
                    {renderItemSection('Atividade Física', 'atividades')}

                    {/* Consome Álcool? */}
                    <Box sx={{ mb: 3 }}>
                        <SectionTitle>Consome Álcool?</SectionTitle>
                        <StyledToggleButtonGroup
                            value={consumeAlcool}
                            exclusive
                            onChange={(e, val) => handleToggleChange('alcool', e, val)}
                            aria-label="Consome álcool?"
                            size="small"
                        >
                            <ToggleButton value="Sim" aria-label="Sim">
                                Sim
                            </ToggleButton>
                            <ToggleButton value="Não" aria-label="Não">
                                Não
                            </ToggleButton>
                        </StyledToggleButtonGroup>
                    </Box>

                    {/* É Fumante? */}
                    <Box sx={{ mb: 3 }}>
                        <SectionTitle>É Fumante?</SectionTitle>
                        <StyledToggleButtonGroup
                            value={ehFumante}
                            exclusive
                            onChange={(e, val) => handleToggleChange('fumante', e, val)}
                            aria-label="É fumante?"
                            size="small"
                        >
                            <ToggleButton value="Sim" aria-label="Sim">
                                Sim
                            </ToggleButton>
                            <ToggleButton value="Não" aria-label="Não">
                                Não
                            </ToggleButton>
                        </StyledToggleButtonGroup>
                    </Box>
                </Grid>
            </Grid>
        </FormSectionContainer>
    );
};

export default CondicoesClinicasForm;