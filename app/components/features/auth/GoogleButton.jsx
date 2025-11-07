"use client";

import React, { useState } from 'react';
import { Button, CircularProgress, Box, Typography } from '@mui/material';

// Ícone oficial do Google otimizado
const GoogleIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ marginRight: '12px' }}>
        <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
    </svg>
);

const GoogleButton = ({
                          onClick,
                          loading = false,
                          disabled = false,
                          text = "Continuar com Google",
                          type = "signin", // "signin" ou "signup"
                          fullWidth = true,
                          size = "medium" // "small", "medium", "large"
                      }) => {
    const [isHovered, setIsHovered] = useState(false);

    // Textos baseados no tipo
    const getButtonText = () => {
        if (loading) return 'Carregando...';

        switch (type) {
            case 'signup':
                return text || 'Criar conta com Google';
            case 'signin':
            default:
                return text || 'Entrar com Google';
        }
    };

    // Tamanhos responsivos
    const getSizeConfig = () => {
        switch (size) {
            case 'small':
                return {
                    height: 40,
                    fontSize: '0.875rem',
                    iconSize: 18,
                    px: 2,
                    py: 1
                };
            case 'large':
                return {
                    height: 56,
                    fontSize: '1.1rem',
                    iconSize: 24,
                    px: 3,
                    py: 1.5
                };
            default: // medium
                return {
                    height: 48,
                    fontSize: '1rem',
                    iconSize: 20,
                    px: 2.5,
                    py: 1.25
                };
        }
    };

    const sizeConfig = getSizeConfig();

    return (
        <Button
            onClick={onClick}
            disabled={disabled || loading}
            fullWidth={fullWidth}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
                height: sizeConfig.height,
                backgroundColor: '#ffffff',
                color: '#3c4043',
                border: '1px solid #dadce0',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                fontSize: sizeConfig.fontSize,
                fontFamily: 'Roboto, Arial, sans-serif',
                letterSpacing: '0.25px',
                px: sizeConfig.px,
                py: sizeConfig.py,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
                boxShadow: isHovered && !disabled ?
                    '0 1px 3px 0 rgba(60,64,67,.30), 0 4px 8px 3px rgba(60,64,67,.15)' :
                    '0 1px 2px 0 rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15)',
                '&:hover': {
                    backgroundColor: '#f8f9fa',
                    borderColor: '#d2d2d2',
                    boxShadow: '0 1px 3px 0 rgba(60,64,67,.30), 0 4px 8px 3px rgba(60,64,67,.15)'
                },
                '&:active': {
                    backgroundColor: '#f1f3f4',
                    boxShadow: '0 1px 2px 0 rgba(60,64,67,.30), 0 2px 6px 2px rgba(60,64,67,.15)'
                },
                '&:focus': {
                    outline: 'none',
                    boxShadow: '0 1px 3px 0 rgba(60,64,67,.30), 0 4px 8px 3px rgba(60,64,67,.15), 0 0 0 1px #4285f4'
                },
                '&:disabled': {
                    backgroundColor: '#ffffff',
                    color: '#9aa0a6',
                    borderColor: '#f1f3f4',
                    boxShadow: 'none',
                    cursor: 'not-allowed'
                }
            }}
        >
            {loading ? (
                <CircularProgress
                    size={sizeConfig.iconSize}
                    sx={{
                        color: '#3c4043',
                        mr: 1.5
                    }}
                />
            ) : (
                <GoogleIcon size={sizeConfig.iconSize} />
            )}

            <Typography
                component="span"
                sx={{
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    fontFamily: 'inherit',
                    letterSpacing: 'inherit',
                    color: loading || disabled ? '#9aa0a6' : '#3c4043'
                }}
            >
                {getButtonText()}
            </Typography>
        </Button>
    );
};

// Componente com divisor "ou" otimizado
export const GoogleButtonWithDivider = ({
                                            onGoogleAuth,
                                            loading,
                                            text,
                                            type = "signin",
                                            size = "medium"
                                        }) => {
    return (
        <Box sx={{ width: '100%' }}>
            {/* Botão Google */}
            <GoogleButton
                onClick={onGoogleAuth}
                loading={loading}
                text={text}
                type={type}
                size={size}
                fullWidth
            />

            {/* Divisor "ou" */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                my: 3,
                gap: 2
            }}>
                <Box sx={{
                    flex: 1,
                    height: '1px',
                    backgroundColor: '#e0e0e0'
                }} />
                <Typography
                    variant="body2"
                    sx={{
                        color: 'text.secondary',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        px: 1,
                        fontFamily: 'Roboto, Arial, sans-serif'
                    }}
                >
                    ou
                </Typography>
                <Box sx={{
                    flex: 1,
                    height: '1px',
                    backgroundColor: '#e0e0e0'
                }} />
            </Box>
        </Box>
    );
};

export default GoogleButton;