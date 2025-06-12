"use client";

import React, { useState } from 'react';
import { Button, CircularProgress, Box, Typography } from '@mui/material';

const GoogleIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24">
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

const GoogleAuthButton = ({
                              onClick,
                              loading = false,
                              disabled = false,
                              text = "Continuar com Google",
                              variant = "outlined", // "outlined" ou "contained"
                              fullWidth = true,
                              size = "medium" // "small", "medium", "large"
                          }) => {
    const [isHovered, setIsHovered] = useState(false);

    const getButtonStyles = () => {
        const baseStyles = {
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
            position: 'relative',
            transition: 'all 0.2s ease-in-out',
            border: '1px solid #dadce0',
            '&:disabled': {
                backgroundColor: '#f8f9fa',
                borderColor: '#f8f9fa',
                color: '#9aa0a6'
            }
        };

        if (variant === "outlined") {
            return {
                ...baseStyles,
                backgroundColor: 'white',
                color: '#3c4043',
                '&:hover': {
                    backgroundColor: '#f8f9fa',
                    borderColor: '#dadce0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                },
                '&:active': {
                    backgroundColor: '#f1f3f4'
                }
            };
        } else {
            return {
                ...baseStyles,
                backgroundColor: '#4285f4',
                color: 'white',
                borderColor: '#4285f4',
                '&:hover': {
                    backgroundColor: '#3367d6',
                    borderColor: '#3367d6',
                    boxShadow: '0 2px 8px rgba(66,133,244,0.3)'
                }
            };
        }
    };

    const getSizeProps = () => {
        switch (size) {
            case "small":
                return {
                    py: 1,
                    px: 2,
                    fontSize: '0.875rem',
                    iconSize: 18
                };
            case "large":
                return {
                    py: 1.8,
                    px: 3,
                    fontSize: '1.1rem',
                    iconSize: 24
                };
            default:
                return {
                    py: 1.4,
                    px: 2.5,
                    fontSize: '1rem',
                    iconSize: 20
                };
        }
    };

    const sizeProps = getSizeProps();

    return (
        <Button
            variant="text"
            fullWidth={fullWidth}
            onClick={onClick}
            disabled={disabled || loading}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
                ...getButtonStyles(),
                py: sizeProps.py,
                px: sizeProps.px,
                fontSize: sizeProps.fontSize,
                height: size === "large" ? 56 : size === "small" ? 40 : 48
            }}
            startIcon={
                loading ? (
                    <CircularProgress
                        size={sizeProps.iconSize}
                        color={variant === "outlined" ? "inherit" : "inherit"}
                        sx={{ color: variant === "outlined" ? '#3c4043' : 'white' }}
                    />
                ) : (
                    <GoogleIcon size={sizeProps.iconSize} />
                )
            }
        >
            <Typography
                component="span"
                sx={{
                    fontSize: 'inherit',
                    fontWeight: 'inherit',
                    letterSpacing: '0.25px'
                }}
            >
                {loading ? 'Carregando...' : text}
            </Typography>
        </Button>
    );
};

// Componente com divisor "ou"
export const GoogleAuthWithDivider = ({
                                          onGoogleAuth,
                                          loading,
                                          text = "Continuar com Google",
                                          variant = "outlined",
                                          size = "medium"
                                      }) => {
    return (
        <Box sx={{ width: '100%' }}>
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
                        px: 1
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

            {/* Botão Google */}
            <GoogleAuthButton
                onClick={onGoogleAuth}
                loading={loading}
                text={text}
                variant={variant}
                size={size}
                fullWidth
            />
        </Box>
    );
};

export default GoogleAuthButton;