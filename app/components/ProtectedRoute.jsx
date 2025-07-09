// components/ProtectedRoute.jsx

import React, { useEffect, useState } from 'react';
import { useAuth } from './authProvider';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import AccessDenied from './organismsComponents/AccessDeniedComponent';

/**
 * Componente para proteger rotas baseado no sistema de secretárias
 * Funciona tanto para médicos quanto para secretárias
 */
const ProtectedRoute = ({ 
    children, 
    requiredModule, 
    requiredAction = 'read',
    fallback = null,
    redirectTo = '/app'
}) => {
    const { 
        user, 
        loading, 
        isSecretary, 
        hasModulePermission, 
        userContext 
    } = useAuth();
    
    const router = useRouter();
    const [permissionCheck, setPermissionCheck] = useState({
        loading: true,
        hasAccess: false,
        reason: null
    });

    useEffect(() => {
        const checkPermissions = async () => {
            // Se ainda está carregando auth, aguardar
            if (loading) {
                return;
            }

            // Se não há usuário, redirecionar para login
            if (!user) {
                router.push('/');
                return;
            }

            // Se não especificou módulo, permitir acesso
            if (!requiredModule) {
                setPermissionCheck({
                    loading: false,
                    hasAccess: true,
                    reason: null
                });
                return;
            }

            // Verificar permissão
            const hasAccess = hasModulePermission(requiredModule, requiredAction);
            
            setPermissionCheck({
                loading: false,
                hasAccess,
                reason: hasAccess ? null : (
                    isSecretary ? 
                        `Secretária não tem permissão para ${requiredAction} no módulo ${requiredModule}` : 
                        `Módulo ${requiredModule} não disponível no seu plano`
                )
            });
        };

        checkPermissions();
    }, [user, loading, requiredModule, requiredAction, hasModulePermission, isSecretary, router]);

    // Mostrar loading enquanto verifica permissões
    if (loading || permissionCheck.loading) {
        return (
            <Box 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: '200px',
                    flexDirection: 'column',
                    gap: 2
                }}
            >
                <CircularProgress />
                <Typography variant="body2" color="text.secondary">
                    Verificando permissões...
                </Typography>
            </Box>
        );
    }

    // Se não tem acesso, mostrar página de acesso negado
    if (!permissionCheck.hasAccess) {
        if (fallback) {
            return fallback;
        }
        
        return (
            <AccessDenied 
                requiredModule={requiredModule}
                requiredAction={requiredAction}
                fallbackMessage={permissionCheck.reason}
            />
        );
    }

    // Se chegou até aqui, tem acesso
    return <>{children}</>;
};

/**
 * HOC para proteger componentes
 */
export const withProtectedRoute = (requiredModule, requiredAction = 'read') => {
    return (WrappedComponent) => {
        const ProtectedComponent = (props) => {
            return (
                <ProtectedRoute 
                    requiredModule={requiredModule}
                    requiredAction={requiredAction}
                >
                    <WrappedComponent {...props} />
                </ProtectedRoute>
            );
        };

        ProtectedComponent.displayName = `withProtectedRoute(${WrappedComponent.displayName || WrappedComponent.name})`;
        return ProtectedComponent;
    };
};

/**
 * Hook para verificar permissões programaticamente
 */
export const usePermissionCheck = (requiredModule, requiredAction = 'read') => {
    const { hasModulePermission, isSecretary } = useAuth();
    
    return {
        hasPermission: hasModulePermission(requiredModule, requiredAction),
        isSecretary
    };
};

export default ProtectedRoute;