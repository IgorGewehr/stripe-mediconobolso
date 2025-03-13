"use client";

import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { styled } from '@mui/material/styles';
import InfoBasicasForm from "./organismsComponents/informacoesBasicas";
import CondicoesClinicasForm from "./organismsComponents/condicoesClinicas";
import HistoricoCondutaForm from "./organismsComponents/historicoConduta";
// Estilo personalizado para os Accordions
const CustomAccordion = styled(Accordion)(({ theme }) => ({
    borderRadius: '16px',
    boxShadow: 'none',
    margin: '12px 0',
    '&:before': {
        display: 'none',
    },
    background: 'white',
    border: '1px solid #EAECEF',
}));

const CustomAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
    padding: '16px 24px',
    '& .MuiAccordionSummary-content': {
        margin: '0',
    },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
    color: '#111E5A',
    fontFamily: 'Gellix, sans-serif',
    fontSize: '18px',
    fontWeight: 600,
    lineHeight: '24px',
}));

// Componente Principal
export default function PacienteCadastroTemplate() {
    // Estado para controlar os accordions expandidos
    const [expandedSections, setExpandedSections] = useState({
        infoBasicas: true,
        condicoesClinicas: true,
        historicoConduta: true
    });

    // Função para alternar a expansão de uma seção
    const handleToggleSection = (section) => {
        setExpandedSections({
            ...expandedSections,
            [section]: !expandedSections[section]
        });
    };

    // Função para lidar com o envio do formulário
    const handleSubmit = () => {
        // Implementar lógica para envio dos dados do formulário
        console.log('Formulário enviado');
    };

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                width: '100%',
                backgroundColor: '#F4F9FF',
                p: '24px',
                boxSizing: 'border-box',
            }}
        >
            <Typography
                variant="h4"
                sx={{
                    color: '#111E5A',
                    fontFamily: 'Gellix, sans-serif',
                    fontSize: '24px',
                    fontWeight: 700,
                    mb: 2
                }}
            >
                Cadastro de Paciente
            </Typography>

            {/* Seção de Informações Básicas */}
            <CustomAccordion
                expanded={expandedSections.infoBasicas}
                onChange={() => handleToggleSection('infoBasicas')}
            >
                <CustomAccordionSummary
                    expandIcon={expandedSections.infoBasicas ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                >
                    <SectionTitle>Informações Básicas</SectionTitle>
                </CustomAccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                    <InfoBasicasForm />
                </AccordionDetails>
            </CustomAccordion>

            {/* Seção de Condições Clínicas */}
            <CustomAccordion
                expanded={expandedSections.condicoesClinicas}
                onChange={() => handleToggleSection('condicoesClinicas')}
            >
                <CustomAccordionSummary
                    expandIcon={expandedSections.condicoesClinicas ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                >
                    <SectionTitle>Condições Clínicas</SectionTitle>
                </CustomAccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                    <CondicoesClinicasForm />
                </AccordionDetails>
            </CustomAccordion>

            {/* Seção de Histórico e Primeira Conduta */}
            <CustomAccordion
                expanded={expandedSections.historicoConduta}
                onChange={() => handleToggleSection('historicoConduta')}
            >
                <CustomAccordionSummary
                    expandIcon={expandedSections.historicoConduta ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                >
                    <SectionTitle>Histórico e Primeira Conduta</SectionTitle>
                </CustomAccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                    <HistoricoCondutaForm />
                </AccordionDetails>
            </CustomAccordion>

            {/* Botões de ação */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 2,
                    mt: 3
                }}
            >
                <Button
                    variant="outlined"
                    sx={{
                        borderRadius: '999px',
                        padding: '8px 32px',
                        color: '#111E5A',
                        borderColor: '#111E5A',
                        fontFamily: 'Gellix, sans-serif',
                        textTransform: 'none',
                        fontSize: '16px',
                        fontWeight: 500,
                        '&:hover': {
                            borderColor: '#0A144A',
                            backgroundColor: 'rgba(17, 30, 90, 0.04)'
                        }
                    }}
                >
                    Voltar
                </Button>
                <Button
                    variant="contained"
                    sx={{
                        borderRadius: '999px',
                        padding: '8px 32px',
                        backgroundColor: '#111E5A',
                        fontFamily: 'Gellix, sans-serif',
                        textTransform: 'none',
                        fontSize: '16px',
                        fontWeight: 500,
                        '&:hover': {
                            backgroundColor: '#0A144A'
                        }
                    }}
                    onClick={handleSubmit}
                >
                    Confirmar Cadastro
                </Button>
            </Box>
        </Box>
    );
}