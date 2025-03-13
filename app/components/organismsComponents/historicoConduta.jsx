"use client";

import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Grid,
    Paper,
    Button
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AttachFileIcon from '@mui/icons-material/AttachFile';

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
        borderRadius: '16px',
        '& fieldset': {
            borderColor: 'rgba(17, 30, 90, 0.30)'
        },
        '&:hover fieldset': {
            borderColor: 'rgba(17, 30, 90, 0.50)'
        },
        '&.Mui-focused fieldset': {
            borderColor: '#111E5A'
        }
    }
});

const FormSectionContainer = styled(Box)({
    padding: '24px',
    width: '100%',
});

const HistoricoCondutaForm = () => {
    // Estados para os campos do formulário
    const [doencasHereditarias, setDoencasHereditarias] = useState('');
    const [condutaInicial, setCondutaInicial] = useState('');
    const [arquivoAnexo, setArquivoAnexo] = useState(null);

    // Função para lidar com o upload de arquivo
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setArquivoAnexo(file);
        }
    };

    // Função para remover o arquivo anexado
    const handleRemoveFile = () => {
        setArquivoAnexo(null);
    };

    return (
        <FormSectionContainer>
            <Grid container spacing={3}>
                {/* Doenças Genéticas ou Hereditárias */}
                <Grid item xs={12}>
                    <SectionTitle>Doenças Genéticas ou Hereditárias</SectionTitle>
                    <StyledTextField
                        multiline
                        rows={4}
                        placeholder="O paciente relata histórico familiar de diabetes tipo 2 em familiares de primeiro grau e hipertensão arterial."
                        value={doencasHereditarias}
                        onChange={(e) => setDoencasHereditarias(e.target.value)}
                        fullWidth
                    />
                </Grid>

                {/* Conduta Inicial */}
                <Grid item xs={12}>
                    <SectionTitle>Conduta Inicial</SectionTitle>
                    <StyledTextField
                        multiline
                        rows={6}
                        placeholder="Solicitado exame de hemograma completo, glicemia em jejum e perfil lipídico para avaliação inicial. Recomendado controle alimentar com redução de carboidratos simples e verificação da pressão arterial 3x por semana."
                        value={condutaInicial}
                        onChange={(e) => setCondutaInicial(e.target.value)}
                        fullWidth
                    />
                </Grid>

                {/* Anexo */}
                <Grid item xs={12}>
                    <SectionTitle>Anexo</SectionTitle>
                    <Box
                        sx={{
                            border: '1px dashed rgba(17, 30, 90, 0.30)',
                            borderRadius: '16px',
                            padding: 2,
                            backgroundColor: 'rgba(17, 30, 90, 0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                backgroundColor: 'rgba(17, 30, 90, 0.08)',
                            }
                        }}
                        onClick={() => document.getElementById('fileInput').click()}
                    >
                        <input
                            type="file"
                            id="fileInput"
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                        />

                        {!arquivoAnexo ? (
                            <>
                                <AttachFileIcon sx={{ fontSize: 32, color: '#111E5A', transform: 'rotate(45deg)' }} />
                                <Typography
                                    sx={{
                                        color: '#111E5A',
                                        fontFamily: 'Gellix, sans-serif',
                                        fontSize: '14px',
                                        textAlign: 'center',
                                        mt: 1
                                    }}
                                >
                                    Arraste e solte arquivos aqui ou clique para anexar
                                </Typography>
                                <Typography
                                    sx={{
                                        color: 'rgba(17, 30, 90, 0.60)',
                                        fontFamily: 'Gellix, sans-serif',
                                        fontSize: '12px',
                                        textAlign: 'center',
                                        mt: 0.5
                                    }}
                                >
                                    PDF, JPEG, PNG (máx. 10MB)
                                </Typography>
                            </>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        width: '100%',
                                        padding: 1,
                                        backgroundColor: 'white',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(17, 30, 90, 0.20)',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Box
                                            sx={{
                                                backgroundColor: '#E3F2FD',
                                                borderRadius: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '6px',
                                                marginRight: 1,
                                            }}
                                        >
                                            <Typography sx={{ fontWeight: 'bold', color: '#111E5A' }}>
                                                {arquivoAnexo.name.split('.').pop().toUpperCase()}
                                            </Typography>
                                        </Box>
                                        <Typography
                                            sx={{
                                                color: '#111E5A',
                                                fontFamily: 'Gellix, sans-serif',
                                                fontSize: '14px',
                                            }}
                                        >
                                            {arquivoAnexo.name}
                                        </Typography>
                                    </Box>
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveFile();
                                        }}
                                        sx={{
                                            color: 'rgba(17, 30, 90, 0.60)',
                                            '&:hover': {
                                                backgroundColor: 'transparent',
                                                color: '#111E5A',
                                            }
                                        }}
                                    >
                                        Remover
                                    </Button>
                                </Box>
                                <Typography
                                    sx={{
                                        color: 'rgba(17, 30, 90, 0.60)',
                                        fontFamily: 'Gellix, sans-serif',
                                        fontSize: '12px',
                                        textAlign: 'center',
                                        mt: 1
                                    }}
                                >
                                    Clique para substituir o arquivo
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Grid>
            </Grid>
        </FormSectionContainer>
    );
};

export default HistoricoCondutaForm;