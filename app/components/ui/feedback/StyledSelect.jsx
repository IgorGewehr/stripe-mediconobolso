'use client';

import React, { useState } from 'react';
import {
    FormControl,
    Select,
    MenuItem,
    Box,
    Typography,
    InputAdornment,
} from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';

// Estilos base do select
const getSelectStyles = (hasError, isSuccess, isFocused) => ({
    borderRadius: '12px',
    backgroundColor: '#FFFFFF',
    fontSize: '15px',
    transition: 'all 0.2s ease',
    '& .MuiOutlinedInput-notchedOutline': {
        borderColor: hasError
            ? '#EF4444'
            : isSuccess
                ? '#10B981'
                : 'rgba(17, 30, 90, 0.15)',
        borderWidth: '1.5px',
        transition: 'all 0.2s ease',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: hasError
            ? '#DC2626'
            : isSuccess
                ? '#059669'
                : 'rgba(17, 30, 90, 0.3)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: hasError ? '#EF4444' : isSuccess ? '#10B981' : '#1852FE',
        borderWidth: '2px',
        boxShadow: hasError
            ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
            : isSuccess
                ? '0 0 0 3px rgba(16, 185, 129, 0.1)'
                : '0 0 0 3px rgba(24, 82, 254, 0.1)',
    },
    '&.Mui-disabled': {
        backgroundColor: '#F8FAFF',
        '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(17, 30, 90, 0.08)',
        },
    },
    '& .MuiSelect-select': {
        padding: '14px 16px',
        paddingRight: '40px !important',
    },
});

const StyledSelect = ({
    label,
    value,
    onChange,
    options = [],
    error,
    helperText,
    success,
    placeholder = 'Selecione...',
    required,
    disabled,
    fullWidth = true,
    size = 'medium',
    startAdornment,
    sx = {},
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);

    const hasError = Boolean(error);
    const isSuccess = Boolean(success) && !hasError;

    return (
        <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
            {/* Label externa */}
            {label && (
                <Typography
                    component="label"
                    sx={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: hasError ? '#EF4444' : isFocused ? '#1852FE' : '#4B5574',
                        mb: 0.75,
                        transition: 'color 0.2s ease',
                    }}
                >
                    {label}
                    {required && (
                        <Typography
                            component="span"
                            sx={{ color: '#EF4444', ml: 0.5 }}
                        >
                            *
                        </Typography>
                    )}
                </Typography>
            )}

            <FormControl fullWidth={fullWidth} error={hasError} disabled={disabled}>
                <Select
                    value={value}
                    onChange={onChange}
                    displayEmpty
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    IconComponent={KeyboardArrowDownRoundedIcon}
                    startAdornment={startAdornment && (
                        <InputAdornment position="start">{startAdornment}</InputAdornment>
                    )}
                    MenuProps={{
                        PaperProps: {
                            sx: {
                                borderRadius: '12px',
                                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                                mt: 1,
                                border: '1px solid rgba(0, 0, 0, 0.04)',
                                '& .MuiList-root': {
                                    py: 1,
                                },
                            },
                        },
                        anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'left',
                        },
                        transformOrigin: {
                            vertical: 'top',
                            horizontal: 'left',
                        },
                    }}
                    sx={{
                        ...getSelectStyles(hasError, isSuccess, isFocused),
                        ...sx,
                    }}
                    renderValue={(selected) => {
                        if (!selected || selected === '') {
                            return (
                                <Typography sx={{ color: '#9CA3AF' }}>
                                    {placeholder}
                                </Typography>
                            );
                        }
                        const selectedOption = options.find(opt => opt.value === selected);
                        return selectedOption?.label || selected;
                    }}
                    {...props}
                >
                    {options.map((option) => (
                        <MenuItem
                            key={option.value}
                            value={option.value}
                            sx={{
                                py: 1.25,
                                px: 2,
                                mx: 1,
                                borderRadius: '8px',
                                mb: 0.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.15s ease',
                                '&:hover': {
                                    backgroundColor: 'rgba(24, 82, 254, 0.04)',
                                },
                                '&.Mui-selected': {
                                    backgroundColor: 'rgba(24, 82, 254, 0.08)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(24, 82, 254, 0.12)',
                                    },
                                },
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: '14px',
                                    fontWeight: value === option.value ? 600 : 400,
                                    color: value === option.value ? '#1852FE' : '#111E5A',
                                }}
                            >
                                {option.label}
                            </Typography>
                            {value === option.value && (
                                <CheckRoundedIcon
                                    sx={{
                                        fontSize: 18,
                                        color: '#1852FE',
                                        ml: 1,
                                    }}
                                />
                            )}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Helper text */}
            {(hasError && helperText) && (
                <Typography
                    sx={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#EF4444',
                        mt: 0.75,
                        ml: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                    }}
                >
                    {helperText}
                </Typography>
            )}
        </Box>
    );
};

export default StyledSelect;
