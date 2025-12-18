"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Alert,
    Card,
    CardContent,
    Chip,
    Avatar,
    Skeleton,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    Lock as LockIcon,
    ArrowBack as ArrowBackIcon,
    Security as SecurityIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    AdminPanelSettings as AdminIcon,
    Check as CheckIcon,
    Close as CloseIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../../providers/authProvider';

// ✅ CONFIGURAÇÃO LOCAL DE MÓDULOS E SUAS DESCRIÇÕES (removido moduleConfig)
const MODULE_CONFIG = {
    patients: {
        name: 'Pacientes',
        description: 'Visualizar e gerenciar informações dos pacientes',
        icon: '👥',
        color: '#3B82F6',
        actions: {
            read: 'Visualizar lista de pacientes',
            create: 'Criar novos pacientes',
            write: 'Editar informações de pacientes',
            viewDetails: 'Ver informações sensíveis (histórico médico, dados pessoais)'
        }
    },
    appointments: {
        name: 'Agenda',
        description: 'Gerenciar consultas e agendamentos',
        icon: '📅',
        color: '#10B981',
        actions: {
            read: 'Visualizar agenda',
            write: 'Agendar e editar consultas'
        }
    },
    prescriptions: {
        name: 'Receitas',
        description: 'Visualizar e gerenciar receitas médicas',
        icon: '💊',
        color: '#F59E0B',
        actions: {
            read: 'Visualizar receitas',
            write: 'Criar e editar receitas'
        }
    },
    exams: {
        name: 'Exames',
        description: 'Gerenciar exames e resultados',
        icon: '🔬',
        color: '#8B5CF6',
        actions: {
            read: 'Visualizar exames',
            write: 'Cadastrar e editar exames'
        }
    },
    notes: {
        name: 'Notas',
        description: 'Acessar anotações médicas',
        icon: '📝',
        color: '#06B6D4',
        actions: {
            read: 'Visualizar notas',
            write: 'Criar e editar notas'
        }
    },
    financial: {
        name: 'Financeiro',
        description: 'Acessar informações financeiras',
        icon: '💰',
        color: '#DC2626',
        actions: {
            read: 'Visualizar relatórios financeiros',
            write: 'Gerenciar dados financeiros'
        }
    },
    reports: {
        name: 'Relatórios',
        description: 'Gerar e visualizar relatórios',
        icon: '📊',
        color: '#7C3AED',
        actions: {
            read: 'Visualizar relatórios',
            write: 'Gerar novos relatórios'
        }
    }
};

// ✅ COMPONENTE DE CARREGAMENTO PARA VERIFICAÇÃO DE PERMISSÕES
const PermissionLoadingState = () => (
    <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
            <Skeleton variant="text" width={200} height={30} />
        </Box>
        <LinearProgress sx={{ mb: 2 }} />
        <Skeleton variant="text" width="100%" height={20} />
        <Skeleton variant="text" width="80%" height={20} />
    </Box>
);

// ✅ COMPONENTE DE DETALHES DE PERMISSÃO
const PermissionDetails = ({ module, action, userPermissions, onRequestAccess }) => {
    const moduleInfo = MODULE_CONFIG[module];
    if (!moduleInfo) return null;

    const [showDetails, setShowDetails] = useState(false);

    const hasPermission = userPermissions?.[module]?.[action] === true;
    const allModulePermissions = userPermissions?.[module] || {};

    return (
        <Card sx={{ mb: 2, border: '1px solid', borderColor: hasPermission ? '#10B981' : '#EF4444' }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            backgroundColor: moduleInfo.color + '20',
                            mr: 2
                        }}
                    >
                        <Typography sx={{ fontSize: '24px' }}>
                            {moduleInfo.icon}
                        </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {moduleInfo.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {moduleInfo.description}
                        </Typography>
                    </Box>
                    <Chip
                        icon={hasPermission ? <CheckIcon /> : <CloseIcon />}
                        label={hasPermission ? 'Permitido' : 'Negado'}
                        color={hasPermission ? 'success' : 'error'}
                        variant="outlined"
                    />
                </Box>

                <Alert
                    severity={hasPermission ? 'success' : 'error'}
                    sx={{ mb: 2 }}
                >
                    <Typography variant="body2">
                        <strong>Ação necessária:</strong> {moduleInfo.actions[action] || action}
                    </Typography>
                </Alert>

                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setShowDetails(!showDetails)}
                    sx={{ mb: showDetails ? 2 : 0 }}
                >
                    {showDetails ? 'Ocultar' : 'Ver'} Todas as Permissões
                </Button>

                {showDetails && (
                    <List dense>
                        {Object.entries(moduleInfo.actions).map(([actionKey, actionDesc]) => {
                            const hasThisPermission = allModulePermissions[actionKey] === true;
                            return (
                                <ListItem key={actionKey} sx={{ pl: 0 }}>
                                    <ListItemIcon>
                                        {hasThisPermission ? (
                                            <CheckIcon color="success" />
                                        ) : (
                                            <CloseIcon color="error" />
                                        )}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={actionDesc}
                                        secondary={`Permissão: ${actionKey}`}
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                )}

                {!hasPermission && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => onRequestAccess?.(module, action)}
                        sx={{ mt: 2 }}
                    >
                        Solicitar Acesso
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

const AccessDeniedComponent = ({
                            requiredModule,
                            requiredAction = 'read',
                            fallbackMessage,
                            showDetailedPermissions = true
                        }) => {
    const {
        isSecretary,
        hasModulePermission,
        userContext,
        getDisplayUserData,
        permissions,
        loading: authLoading
    } = useAuth();

    const [loading, setLoading] = useState(true);
    const [permissionResult, setPermissionResult] = useState(null);
    const [showRequestDialog, setShowRequestDialog] = useState(false);

    // ✅ VERIFICAR PERMISSÕES DE FORMA MAIS ROBUSTA
    const checkPermissions = useCallback(async () => {
        try {
            setLoading(true);

            // ✅ AGUARDAR O AUTHPROVIDER TERMINAR DE CARREGAR
            if (authLoading) {
                console.log('⏳ Aguardando AuthProvider terminar...');
                return;
            }

            // Médicos sempre têm acesso total
            if (!isSecretary) {
                console.log('👨‍⚕️ Médico detectado, acesso total garantido');
                setPermissionResult({ hasAccess: true, reason: 'doctor' });
                return;
            }

            // ✅ VERIFICAR SE CONTEXTO DE SECRETÁRIA ESTÁ CARREGADO
            if (!userContext || !userContext.isSecretary) {
                console.log('⚠️ Contexto de secretária não carregado ainda');
                setPermissionResult({
                    hasAccess: false,
                    reason: 'context_loading',
                    needsWait: true
                });
                return;
            }

            // ✅ VERIFICAR SE PERMISSÕES ESTÃO DISPONÍVEIS
            if (!permissions || typeof permissions !== 'object') {
                console.log('⚠️ Permissões não carregadas ainda');
                setPermissionResult({
                    hasAccess: false,
                    reason: 'permissions_loading',
                    needsWait: true
                });
                return;
            }

            console.log('🔍 Verificando permissão de secretária:', {
                module: requiredModule,
                action: requiredAction,
                permissions: permissions
            });

            // Verificar permissão da secretária
            const hasAccess = hasModulePermission(requiredModule, requiredAction);

            setPermissionResult({
                hasAccess,
                reason: hasAccess ? 'permission_granted' : 'permission_denied',
                module: requiredModule,
                action: requiredAction,
                userPermissions: permissions
            });

            console.log(`✅ Verificação concluída: ${hasAccess ? 'ACESSO PERMITIDO' : 'ACESSO NEGADO'}`);

        } catch (error) {
            console.error('❌ Erro ao verificar permissões:', error);
            setPermissionResult({
                hasAccess: false,
                reason: 'error',
                error: error.message
            });
        } finally {
            setLoading(false);
        }
    }, [isSecretary, hasModulePermission, requiredModule, requiredAction, permissions, userContext, authLoading]);

    // ✅ VERIFICAÇÃO COM RETRY PARA AGUARDAR CARREGAMENTO COMPLETO
    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 5;
        const retryDelay = 1000;

        const checkWithRetry = async () => {
            await checkPermissions();

            // ✅ SE AINDA ESTÁ CARREGANDO E TEMOS RETRIES, TENTAR NOVAMENTE
            if (permissionResult?.needsWait && retryCount < maxRetries) {
                retryCount++;
                console.log(`🔄 Retry ${retryCount}/${maxRetries} para verificação de permissões...`);
                setTimeout(checkWithRetry, retryDelay);
            }
        };

        checkWithRetry();
    }, [checkPermissions]);

    // ✅ FUNÇÃO PARA SOLICITAR ACESSO
    const handleRequestAccess = useCallback((module, action) => {
        setShowRequestDialog(true);
    }, []);

    // ✅ FUNÇÃO PARA VOLTAR AO DASHBOARD
    const handleBackToDashboard = useCallback(() => {
        if (window.handleBackToDashboard) {
            window.handleBackToDashboard();
        } else {
            window.location.href = '/app';
        }
    }, []);

    // ✅ MOSTRAR LOADING ENQUANTO VERIFICA
    if (loading || authLoading || permissionResult?.needsWait) {
        return (
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                    <Skeleton variant="text" width={200} height={30} />
                </Box>
                <LinearProgress sx={{ mb: 2 }} />
                <Typography variant="body2" color="textSecondary">
                    {authLoading ? 'Carregando dados do usuário...' : 'Verificando permissões...'}
                </Typography>
                <Skeleton variant="text" width="100%" height={20} />
                <Skeleton variant="text" width="80%" height={20} />
            </Box>
        );
    }

    // ✅ Este componente só deve ser usado quando NÃO há acesso
    // Se tiver acesso, não deveria estar renderizando este componente
    if (permissionResult?.hasAccess) {
        console.warn('AccessDeniedComponent renderizado com acesso permitido - isso não deveria acontecer');
        return null;
    }

    // ✅ SE HOUVE ERRO, MOSTRAR MENSAGEM ESPECÍFICA
    if (permissionResult?.reason === 'error') {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                        <strong>Erro ao verificar permissões:</strong><br />
                        {permissionResult.error}
                    </Typography>
                </Alert>
                <Button variant="outlined" onClick={() => window.location.reload()}>
                    Recarregar Página
                </Button>
            </Box>
        );
    }

    // ✅ OBTER DADOS PARA EXIBIÇÃO
    const displayData = getDisplayUserData();

    // ✅ RENDERIZAR TELA DE ACESSO NEGADO MELHORADA
    return (
        <>
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
                textAlign: 'center',
                p: 3,
                backgroundColor: '#fafafa',
                borderRadius: 2
            }}>
                {/* Ícone e título principal */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    backgroundColor: '#ffebee',
                    mb: 3
                }}>
                    <LockIcon sx={{ fontSize: 64, color: '#f44336' }} />
                </Box>

                <Typography variant="h4" sx={{
                    mb: 1,
                    color: '#1a1a1a',
                    fontWeight: 700,
                    fontSize: { xs: '1.5rem', md: '2rem' }
                }}>
                    Acesso Restrito
                </Typography>

                <Typography variant="h6" sx={{
                    mb: 2,
                    color: '#666',
                    fontWeight: 400
                }}>
                    {fallbackMessage || `Você não tem permissão para acessar ${MODULE_CONFIG[requiredModule]?.name || requiredModule}.`}
                </Typography>

                {/* ✅ INFORMAÇÕES DA SECRETÁRIA - MELHORADAS */}
                {isSecretary && displayData && (
                    <Card sx={{ mb: 3, maxWidth: 500, width: '100%' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Avatar sx={{ mr: 2, bgcolor: '#1976d2' }}>
                                    <PersonIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        {displayData?.secretaryName || 'Secretária'}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Trabalhando para Dr. {userContext?.userData?.fullName || 'Médico'}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <EmailIcon sx={{ mr: 1, color: '#666', fontSize: 20 }} />
                                <Typography variant="body2" color="textSecondary">
                                    {displayData?.secretaryEmail || displayData?.email}
                                </Typography>
                            </Box>

                            {/* ✅ INFORMAÇÕES DE DEBUG EM DESENVOLVIMENTO */}
                            {process.env.NODE_ENV === 'development' && (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    <Typography variant="caption">
                                        <strong>Debug:</strong><br />
                                        Módulo: {requiredModule}<br />
                                        Ação: {requiredAction}<br />
                                        Permissões carregadas: {permissions ? 'Sim' : 'Não'}<br />
                                        Contexto carregado: {userContext ? 'Sim' : 'Não'}
                                    </Typography>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Detalhes de permissão */}
                {showDetailedPermissions && permissionResult?.userPermissions && (
                    <Box sx={{ width: '100%', maxWidth: 600 }}>
                        <PermissionDetails
                            module={requiredModule}
                            action={requiredAction}
                            userPermissions={permissionResult.userPermissions}
                            onRequestAccess={handleRequestAccess}
                        />
                    </Box>
                )}

                {/* Botões de ação */}
                <Box sx={{
                    display: 'flex',
                    gap: 2,
                    flexDirection: { xs: 'column', sm: 'row' },
                    width: { xs: '100%', sm: 'auto' }
                }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={handleBackToDashboard}
                        sx={{
                            borderColor: '#1976d2',
                            color: '#1976d2',
                            '&:hover': {
                                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                borderColor: '#1976d2'
                            }
                        }}
                    >
                        Voltar ao Dashboard
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<SecurityIcon />}
                        onClick={() => handleRequestAccess(requiredModule, requiredAction)}
                        sx={{
                            backgroundColor: '#1976d2',
                            '&:hover': {
                                backgroundColor: '#1565c0'
                            }
                        }}
                    >
                        Solicitar Acesso
                    </Button>
                </Box>

                {/* Informação adicional */}
                <Alert severity="info" sx={{ mt: 3, maxWidth: 500 }}>
                    <Typography variant="body2">
                        <strong>💡 Dica:</strong> Entre em contato com o médico responsável para solicitar
                        as permissões necessárias para acessar esta área do sistema.
                    </Typography>
                </Alert>
            </Box>

            {/* Dialog para solicitar acesso */}
            <Dialog
                open={showRequestDialog}
                onClose={() => setShowRequestDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SecurityIcon sx={{ mr: 2, color: '#1976d2' }} />
                        Solicitar Acesso
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Para solicitar acesso a esta funcionalidade, entre em contato diretamente
                        com Dr. {userContext?.userData?.fullName}.
                    </Alert>

                    <Typography variant="body2" sx={{ mb: 2 }}>
                        <strong>Módulo solicitado:</strong> {MODULE_CONFIG[requiredModule]?.name}<br />
                        <strong>Permissão necessária:</strong> {MODULE_CONFIG[requiredModule]?.actions[requiredAction] || requiredAction}
                    </Typography>

                    <Typography variant="body2" color="textSecondary">
                        O médico responsável poderá ajustar suas permissões através do painel
                        de gerenciamento de secretárias.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowRequestDialog(false)}>
                        Entendi
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

// ✅ HOOK PERSONALIZADO PARA GERENCIAR PERMISSÕES
export const usePermissionManager = () => {
    const { isSecretary, hasModulePermission, permissions } = useAuth();

    const checkMultiplePermissions = useCallback((modulePermissions) => {
        if (!isSecretary) return { hasAccess: true, deniedModules: [] };

        const deniedModules = [];
        let hasAccess = true;

        for (const [module, action] of Object.entries(modulePermissions)) {
            if (!hasModulePermission(module, action)) {
                hasAccess = false;
                deniedModules.push({ module, action });
            }
        }

        return { hasAccess, deniedModules };
    }, [isSecretary, hasModulePermission]);

    const getModuleInfo = useCallback((module) => {
        return MODULE_CONFIG[module] || null;
    }, []);

    const getUserPermissionLevel = useCallback((module) => {
        if (!isSecretary) return 'full';

        const modulePermissions = permissions?.[module] || {};

        if (modulePermissions.write) return 'write';
        if (modulePermissions.read) return 'read';
        return 'none';
    }, [isSecretary, permissions]);

    return {
        checkMultiplePermissions,
        getModuleInfo,
        getUserPermissionLevel,
        modules: MODULE_CONFIG
    };
};

export default AccessDeniedComponent;