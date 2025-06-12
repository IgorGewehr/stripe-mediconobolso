"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    Button,
    IconButton,
    Avatar,
    Slide,
    useTheme,
    useMediaQuery
} from "@mui/material";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

// Ícones
import CloseIcon from "@mui/icons-material/Close";
import LockIcon from "@mui/icons-material/Lock";
import UpgradeIcon from "@mui/icons-material/Upgrade";
import StarIcon from "@mui/icons-material/Star";

// Tema consistente com o padrão existente
const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1852FE',
            light: '#ECF1FF',
            dark: '#0A3CC9',
        },
        warning: {
            main: '#FF9800',
            light: '#FFF8E1',
            dark: '#F57C00',
        },
        error: {
            main: '#FF4B55',
            light: '#FFEBEE',
            dark: '#E11D48',
        },
        upgrade: {
            main: '#7B4BC9',
            light: '#F3E8FF',
            dark: '#6B46C1',
        },
        grey: {
            100: '#F6F7F9',
            200: '#EAECEF',
            300: '#DFE3EB',
            400: '#94A3B8',
            500: '#64748B',
            800: '#344054',
        }
    },
    typography: {
        fontFamily: '"Gellix", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 20,
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 50,
                }
            }
        }
    }
});

// Transição suave
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

// Mapeamento de módulos para ícones e descrições
const MODULE_INFO = {
    'receitas': {
        icon: '💊',
        name: 'Receitas Médicas',
        description: 'Criar e gerenciar receitas digitais'
    },
    'agenda': {
        icon: '📅',
        name: 'Agenda Médica',
        description: 'Agendar e gerenciar consultas'
    },
    'pacientes': {
        icon: '👥',
        name: 'Pacientes',
        description: 'Gerenciar cadastro de pacientes'
    },
    'metricas': {
        icon: '📊',
        name: 'Métricas e Relatórios',
        description: 'Acessar relatórios detalhados'
    },
    'financeiro': {
        icon: '💰',
        name: 'Financeiro',
        description: 'Controle financeiro da clínica'
    },
    'ai_analysis': {
        icon: '🤖',
        name: 'Análise por IA',
        description: 'Análise automatizada de exames'
    },
    'dados': {
        icon: '⚙️',
        name: 'Administração',
        description: 'Painel administrativo avançado'
    }
};

const AccessDeniedDialog = ({
                                open,
                                onClose,
                                moduleName = 'este módulo',
                                onUpgrade,
                                title = "Acesso Restrito"
                            }) => {
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Buscar informações do módulo
    const moduleInfo = MODULE_INFO[moduleName] || {
        icon: '🔒',
        name: moduleName,
        description: 'Funcionalidade premium'
    };

    const handleUpgrade = () => {
        if (onUpgrade) {
            onUpgrade();
        } else {
            // Ação padrão - pode ser redirecionar para página de planos
            console.log('Redirecionando para upgrade...');
        }
        onClose();
    };

    return (
        <ThemeProvider theme={theme}>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="xs"
                fullWidth
                TransitionComponent={Transition}
                PaperProps={{
                    sx: {
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0px 8px 40px rgba(24, 82, 254, 0.12)',
                        maxWidth: '400px',
                        margin: isMobile ? '16px' : 'auto'
                    }
                }}
            >
                {/* Header minimalista */}
                <Box
                    sx={{
                        position: 'relative',
                        p: 2,
                        pb: 0
                    }}
                >
                    <IconButton
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: theme.palette.grey[400],
                            '&:hover': {
                                backgroundColor: alpha(theme.palette.grey[400], 0.1)
                            }
                        }}
                        size="small"
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                {/* Content */}
                <DialogContent sx={{ px: 3, py: 2, textAlign: 'center' }}>
                    {/* Ícone principal */}
                    <Box sx={{ mb: 3 }}>
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                mx: 'auto',
                                mb: 2,
                                fontSize: '32px',
                                border: `2px solid ${alpha(theme.palette.warning.main, 0.2)}`
                            }}
                        >
                            {moduleInfo.icon}
                        </Avatar>

                        <Box
                            sx={{
                                position: 'relative',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <LockIcon
                                sx={{
                                    color: theme.palette.warning.main,
                                    fontSize: 20,
                                    mr: 1
                                }}
                            />
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    color: theme.palette.grey[800],
                                    fontSize: '18px'
                                }}
                            >
                                {title}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Conteúdo principal */}
                    <Box sx={{ mb: 3 }}>
                        <Typography
                            variant="body1"
                            sx={{
                                color: theme.palette.grey[700],
                                mb: 1,
                                fontWeight: 500
                            }}
                        >
                            <strong>{moduleInfo.name}</strong> não está disponível no seu plano atual.
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                color: theme.palette.grey[500],
                                lineHeight: 1.5
                            }}
                        >
                            {moduleInfo.description} é uma funcionalidade premium. Faça upgrade para ter acesso completo.
                        </Typography>
                    </Box>

                    {/* Features premium preview */}
                    <Box
                        sx={{
                            mb: 4,
                            p: 2,
                            borderRadius: '12px',
                            backgroundColor: alpha(theme.palette.upgrade.light, 0.5),
                            border: `1px solid ${alpha(theme.palette.upgrade.main, 0.2)}`
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                            <StarIcon sx={{ color: theme.palette.upgrade.main, fontSize: 16, mr: 0.5 }} />
                            <Typography
                                variant="caption"
                                sx={{
                                    color: theme.palette.upgrade.main,
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    fontSize: '11px'
                                }}
                            >
                                Premium
                            </Typography>
                        </Box>
                        <Typography
                            variant="body2"
                            sx={{
                                color: theme.palette.upgrade.dark,
                                fontSize: '13px',
                                fontWeight: 500
                            }}
                        >
                            Desbloqueie todas as funcionalidades e potencialize sua prática médica
                        </Typography>
                    </Box>

                    {/* Botões de ação */}
                    <Box sx={{ display: 'flex', gap: 1.5, flexDirection: isMobile ? 'column' : 'row' }}>
                        <Button
                            variant="outlined"
                            onClick={onClose}
                            sx={{
                                flex: 1,
                                borderColor: theme.palette.grey[300],
                                color: theme.palette.grey[600],
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.grey[300], 0.1),
                                    borderColor: theme.palette.grey[400]
                                }
                            }}
                        >
                            Voltar
                        </Button>

                        <Button
                            variant="contained"
                            startIcon={<UpgradeIcon />}
                            onClick={handleUpgrade}
                            sx={{
                                flex: 1,
                                backgroundColor: theme.palette.upgrade.main,
                                boxShadow: `0 4px 12px ${alpha(theme.palette.upgrade.main, 0.3)}`,
                                '&:hover': {
                                    backgroundColor: theme.palette.upgrade.dark,
                                    boxShadow: `0 6px 16px ${alpha(theme.palette.upgrade.main, 0.4)}`
                                }
                            }}
                        >
                            Fazer Upgrade
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </ThemeProvider>
    );
};

export default AccessDeniedDialog;