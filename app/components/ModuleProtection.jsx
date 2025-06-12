// components/modules/ModuleProtection.js

import React, { useState } from 'react';
import { Box, Tooltip, IconButton } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import InfoIcon from '@mui/icons-material/Info';
import useModuleAccess from './useModuleAccess';
import AccessDeniedDialog from './organismsComponents/accessDeniedDialog';

/**
 * Componente para proteger conteúdo baseado em módulos
 * Pode ser usado como wrapper ou para verificações inline
 */
const ModuleProtection = ({
                              moduleId,
                              children,
                              fallback = null,
                              showDialog = true,
                              showTooltip = false,
                              action = null,
                              context = {},
                              className = "",
                              style = {},
                              onAccessDenied = null,
                              onUpgrade = null
                          }) => {
    const { hasAccess, canPerformAction, getLimitInfo, MODULES } = useModuleAccess();
    const [dialogOpen, setDialogOpen] = useState(false);

    // Verificar acesso
    const accessCheck = action
        ? canPerformAction(moduleId, action, context)
        : { allowed: hasAccess(moduleId), reason: hasAccess(moduleId) ? null : 'module_access_denied' };

    // Se tem acesso, renderizar normalmente
    if (accessCheck.allowed) {
        return <>{children}</>;
    }

    // Callback quando acesso é negado
    const handleAccessDenied = () => {
        if (onAccessDenied) {
            onAccessDenied(accessCheck);
        }

        if (showDialog) {
            setDialogOpen(true);
        }
    };

    // Função para upgrade
    const handleUpgrade = () => {
        if (onUpgrade) {
            onUpgrade(moduleId);
        } else {
            // Ação padrão de upgrade
            window.location.href = '/checkout';
        }
    };

    // Renderizar fallback customizado
    if (fallback) {
        return fallback;
    }

    // Renderizar versão com tooltip
    if (showTooltip) {
        const limitInfo = getLimitInfo(moduleId);
        const tooltipTitle = accessCheck.reason === 'limit_reached'
            ? `Limite atingido: ${limitInfo?.limit} ${limitInfo?.type === 'monthly' ? 'por mês' : 'total'}`
            : `Acesso restrito ao módulo: ${moduleId}`;

        return (
            <Box
                className={className}
                style={style}
                sx={{
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    opacity: 0.6,
                    '&:hover': { opacity: 0.8 }
                }}
                onClick={handleAccessDenied}
            >
                <Tooltip title={tooltipTitle} arrow>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {children}
                        <LockIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                    </Box>
                </Tooltip>

                {showDialog && (
                    <AccessDeniedDialog
                        open={dialogOpen}
                        onClose={() => setDialogOpen(false)}
                        moduleName={moduleId}
                        onUpgrade={handleUpgrade}
                        title={accessCheck.reason === 'limit_reached' ? 'Limite Atingido' : 'Acesso Restrito'}
                    />
                )}
            </Box>
        );
    }

    // Renderizar versão padrão (oculta o conteúdo)
    return (
        <>
            <Box
                className={className}
                style={style}
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    border: '1px dashed',
                    borderColor: 'warning.main',
                    borderRadius: 1,
                    backgroundColor: 'warning.light',
                    color: 'warning.dark',
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: 'warning.main', color: 'white' }
                }}
                onClick={handleAccessDenied}
            >
                <LockIcon sx={{ fontSize: 20 }} />
                <Box sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {accessCheck.reason === 'limit_reached' ? 'Limite atingido' : 'Acesso restrito'}
                </Box>
                <IconButton size="small" sx={{ color: 'inherit' }}>
                    <InfoIcon sx={{ fontSize: 16 }} />
                </IconButton>
            </Box>

            {showDialog && (
                <AccessDeniedDialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    moduleName={moduleId}
                    onUpgrade={handleUpgrade}
                    title={accessCheck.reason === 'limit_reached' ? 'Limite Atingido' : 'Acesso Restrito'}
                />
            )}
        </>
    );
};

/**
 * Hook para verificação simples de acesso (mais leve)
 */
export const useModuleProtection = (moduleId, action = null, context = {}) => {
    const { hasAccess, canPerformAction } = useModuleAccess();

    const check = action
        ? canPerformAction(moduleId, action, context)
        : { allowed: hasAccess(moduleId) };

    return {
        hasAccess: check.allowed,
        reason: check.reason,
        checkResult: check
    };
};

/**
 * HOC para proteger componentes inteiros
 */
export const withModuleProtection = (moduleId, options = {}) => {
    return (WrappedComponent) => {
        const ProtectedComponent = (props) => {
            return (
                <ModuleProtection
                    moduleId={moduleId}
                    {...options}
                >
                    <WrappedComponent {...props} />
                </ModuleProtection>
            );
        };

        ProtectedComponent.displayName = `withModuleProtection(${WrappedComponent.displayName || WrappedComponent.name})`;
        return ProtectedComponent;
    };
};

/**
 * Componente para renderizar condicionalmente baseado em múltiplos módulos
 */
export const MultiModuleProtection = ({
                                          modules = [],
                                          requireAll = false,
                                          children,
                                          fallback = null,
                                          onAccessDenied = null
                                      }) => {
    const { hasAccess } = useModuleAccess();

    const hasRequiredAccess = requireAll
        ? modules.every(moduleId => hasAccess(moduleId))
        : modules.some(moduleId => hasAccess(moduleId));

    if (hasRequiredAccess) {
        return <>{children}</>;
    }

    if (onAccessDenied) {
        onAccessDenied(modules);
    }

    return fallback || null;
};

export default ModuleProtection;