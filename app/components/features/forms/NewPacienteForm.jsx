"use client";

import React, { useState, useCallback } from 'react';
import { Box, Typography, useTheme, useMediaQuery, Collapse, IconButton } from '@mui/material';
import { ChevronDown, ChevronUp, User, Phone, MapPin, Heart, AlertCircle } from 'lucide-react';
import StyledInput, { PhoneInput, CPFInput, CEPInput } from '../../ui/feedback/StyledInput';
import StyledSelect from '../../ui/feedback/StyledSelect';

// Estados brasileiros
const ESTADOS_BR = [
    { value: 'AC', label: 'Acre' },
    { value: 'AL', label: 'Alagoas' },
    { value: 'AP', label: 'Amapá' },
    { value: 'AM', label: 'Amazonas' },
    { value: 'BA', label: 'Bahia' },
    { value: 'CE', label: 'Ceará' },
    { value: 'DF', label: 'Distrito Federal' },
    { value: 'ES', label: 'Espírito Santo' },
    { value: 'GO', label: 'Goiás' },
    { value: 'MA', label: 'Maranhão' },
    { value: 'MT', label: 'Mato Grosso' },
    { value: 'MS', label: 'Mato Grosso do Sul' },
    { value: 'MG', label: 'Minas Gerais' },
    { value: 'PA', label: 'Pará' },
    { value: 'PB', label: 'Paraíba' },
    { value: 'PR', label: 'Paraná' },
    { value: 'PE', label: 'Pernambuco' },
    { value: 'PI', label: 'Piauí' },
    { value: 'RJ', label: 'Rio de Janeiro' },
    { value: 'RN', label: 'Rio Grande do Norte' },
    { value: 'RS', label: 'Rio Grande do Sul' },
    { value: 'RO', label: 'Rondônia' },
    { value: 'RR', label: 'Roraima' },
    { value: 'SC', label: 'Santa Catarina' },
    { value: 'SP', label: 'São Paulo' },
    { value: 'SE', label: 'Sergipe' },
    { value: 'TO', label: 'Tocantins' },
];

const TIPOS_SANGUINEOS = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
];

// Componente de seção com ícone
const FormSection = ({ icon: Icon, title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Box
            sx={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                border: '1px solid rgba(0, 0, 0, 0.04)',
                transition: 'all 0.2s ease',
                '&:hover': {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                },
            }}
        >
            <Box
                onClick={() => setIsOpen(!isOpen)}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2.5,
                    py: 2,
                    cursor: 'pointer',
                    backgroundColor: isOpen ? 'rgba(24, 82, 254, 0.02)' : 'transparent',
                    borderBottom: isOpen ? '1px solid rgba(0, 0, 0, 0.04)' : 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        backgroundColor: 'rgba(24, 82, 254, 0.04)',
                    },
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                        sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '10px',
                            backgroundColor: 'rgba(24, 82, 254, 0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon size={18} color="#1852FE" />
                    </Box>
                    <Typography
                        sx={{
                            fontSize: '15px',
                            fontWeight: 600,
                            color: '#111E5A',
                        }}
                    >
                        {title}
                    </Typography>
                </Box>
                <IconButton size="small" sx={{ color: '#9CA3AF' }}>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </IconButton>
            </Box>
            <Collapse in={isOpen}>
                <Box sx={{ p: 2.5, pt: 2 }}>
                    {children}
                </Box>
            </Collapse>
        </Box>
    );
};

// Componente de gênero com botões elegantes
const GenderSelector = ({ value, onChange }) => {
    const options = [
        { value: 'masculino', label: 'Masculino', emoji: '👨' },
        { value: 'feminino', label: 'Feminino', emoji: '👩' },
        { value: 'outro', label: 'Outro', emoji: '🧑' },
    ];

    return (
        <Box sx={{ display: 'flex', gap: 1.5 }}>
            {options.map((option) => (
                <Box
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    sx={{
                        flex: 1,
                        py: 1.5,
                        px: 2,
                        borderRadius: '12px',
                        border: '2px solid',
                        borderColor: value === option.value ? '#1852FE' : 'rgba(0, 0, 0, 0.08)',
                        backgroundColor: value === option.value ? 'rgba(24, 82, 254, 0.04)' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            borderColor: value === option.value ? '#1852FE' : 'rgba(24, 82, 254, 0.3)',
                            backgroundColor: value === option.value ? 'rgba(24, 82, 254, 0.06)' : 'rgba(24, 82, 254, 0.02)',
                        },
                    }}
                >
                    <Typography sx={{ fontSize: '18px' }}>{option.emoji}</Typography>
                    <Typography
                        sx={{
                            fontSize: '14px',
                            fontWeight: value === option.value ? 600 : 500,
                            color: value === option.value ? '#1852FE' : '#4B5574',
                        }}
                    >
                        {option.label}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
};

function NewPacienteForm({
    formData = {},
    onChange,
    errors = {},
    showAllSections = false
}) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Handler para mudanças nos campos
    const handleChange = useCallback((field) => (e) => {
        const value = e?.target?.value ?? e;
        onChange?.({ ...formData, [field]: value });
    }, [formData, onChange]);

    // Handler para mudanças em campos aninhados
    const handleNestedChange = useCallback((parent, field) => (e) => {
        const value = e?.target?.value ?? e;
        onChange?.({
            ...formData,
            [parent]: {
                ...formData[parent],
                [field]: value,
            },
        });
    }, [formData, onChange]);

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: '800px',
                mx: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
            }}
        >
            {/* Seção: Informações Pessoais */}
            <FormSection icon={User} title="Informações Pessoais" defaultOpen={true}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Nome e Data de Nascimento */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 2 }}>
                        <StyledInput
                            label="Nome Completo"
                            value={formData.nome || ''}
                            onChange={handleChange('nome')}
                            placeholder="Digite o nome completo"
                            required
                            error={!!errors.nome}
                            helperText={errors.nome}
                        />
                        <StyledInput
                            label="Data de Nascimento"
                            type="date"
                            value={formData.dataNascimento || ''}
                            onChange={handleChange('dataNascimento')}
                            required
                            error={!!errors.dataNascimento}
                            helperText={errors.dataNascimento}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>

                    {/* Gênero */}
                    <Box>
                        <Typography
                            sx={{
                                fontSize: '14px',
                                fontWeight: 500,
                                color: '#4B5574',
                                mb: 1,
                            }}
                        >
                            Gênero
                        </Typography>
                        <GenderSelector
                            value={formData.genero || ''}
                            onChange={handleChange('genero')}
                        />
                    </Box>

                    {/* CPF e Tipo Sanguíneo */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 2 }}>
                        <CPFInput
                            value={formData.cpf || ''}
                            onChange={handleChange('cpf')}
                            error={!!errors.cpf}
                            helperText={errors.cpf}
                        />
                        <StyledSelect
                            label="Tipo Sanguíneo"
                            value={formData.tipoSanguineo || ''}
                            onChange={handleChange('tipoSanguineo')}
                            options={TIPOS_SANGUINEOS}
                            placeholder="Selecione..."
                        />
                    </Box>
                </Box>
            </FormSection>

            {/* Seção: Contato */}
            <FormSection icon={Phone} title="Contato" defaultOpen={true}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Email e Telefone */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 2 }}>
                        <StyledInput
                            label="Email"
                            type="email"
                            value={formData.email || ''}
                            onChange={handleChange('email')}
                            placeholder="email@exemplo.com"
                            error={!!errors.email}
                            helperText={errors.email}
                        />
                        <PhoneInput
                            value={formData.telefone || ''}
                            onChange={handleChange('telefone')}
                            error={!!errors.telefone}
                            helperText={errors.telefone}
                        />
                    </Box>

                    {/* Telefone Secundário */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 2 }}>
                        <PhoneInput
                            label="Telefone Secundário"
                            value={formData.telefoneSecundario || ''}
                            onChange={handleChange('telefoneSecundario')}
                        />
                    </Box>
                </Box>
            </FormSection>

            {/* Seção: Endereço */}
            <FormSection icon={MapPin} title="Endereço" defaultOpen={showAllSections}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* CEP e Endereço */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '140px 1fr', gap: 2 }}>
                        <CEPInput
                            value={formData.cep || ''}
                            onChange={handleChange('cep')}
                        />
                        <StyledInput
                            label="Endereço"
                            value={formData.endereco || ''}
                            onChange={handleChange('endereco')}
                            placeholder="Rua, número, complemento"
                        />
                    </Box>

                    {/* Bairro, Cidade e Estado */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 120px', gap: 2 }}>
                        <StyledInput
                            label="Bairro"
                            value={formData.bairro || ''}
                            onChange={handleChange('bairro')}
                            placeholder="Bairro"
                        />
                        <StyledInput
                            label="Cidade"
                            value={formData.cidade || ''}
                            onChange={handleChange('cidade')}
                            placeholder="Cidade"
                        />
                        <StyledSelect
                            label="UF"
                            value={formData.estado || ''}
                            onChange={handleChange('estado')}
                            options={ESTADOS_BR}
                            placeholder="UF"
                        />
                    </Box>
                </Box>
            </FormSection>

            {/* Seção: Informações Médicas */}
            <FormSection icon={Heart} title="Informações Médicas" defaultOpen={showAllSections}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Alergias */}
                    <StyledInput
                        label="Alergias"
                        value={formData.alergias || ''}
                        onChange={handleChange('alergias')}
                        placeholder="Liste alergias conhecidas, separadas por vírgula"
                        multiline
                        rows={2}
                    />

                    {/* Doenças Crônicas */}
                    <StyledInput
                        label="Doenças Crônicas"
                        value={formData.doencasCronicas || ''}
                        onChange={handleChange('doencasCronicas')}
                        placeholder="Liste doenças crônicas, separadas por vírgula"
                        multiline
                        rows={2}
                    />

                    {/* Medicamentos em uso */}
                    <StyledInput
                        label="Medicamentos em Uso"
                        value={formData.medicamentosEmUso || ''}
                        onChange={handleChange('medicamentosEmUso')}
                        placeholder="Liste medicamentos de uso contínuo"
                        multiline
                        rows={2}
                    />
                </Box>
            </FormSection>

            {/* Seção: Observações */}
            <FormSection icon={AlertCircle} title="Observações" defaultOpen={showAllSections}>
                <StyledInput
                    label="Observações Adicionais"
                    value={formData.observacoes || ''}
                    onChange={handleChange('observacoes')}
                    placeholder="Informações adicionais relevantes sobre o paciente"
                    multiline
                    rows={3}
                />
            </FormSection>
        </Box>
    );
}

export default NewPacienteForm;
