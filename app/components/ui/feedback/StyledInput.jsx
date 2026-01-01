'use client';

import React, { useState } from 'react';
import {
  TextField,
  Box,
  Typography,
  InputAdornment,
  IconButton,
} from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';

// Common input styles based on design system
const getInputStyles = (hasError, isSuccess, isFocused) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: '#FFFFFF',
    fontSize: '15px',
    transition: 'all 0.2s ease',
    '& fieldset': {
      borderColor: hasError
        ? '#EF4444'
        : isSuccess
        ? '#10B981'
        : 'rgba(17, 30, 90, 0.15)',
      borderWidth: '1.5px',
      transition: 'all 0.2s ease',
    },
    '&:hover fieldset': {
      borderColor: hasError
        ? '#DC2626'
        : isSuccess
        ? '#059669'
        : 'rgba(17, 30, 90, 0.3)',
    },
    '&.Mui-focused fieldset': {
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
      '& fieldset': {
        borderColor: 'rgba(17, 30, 90, 0.08)',
      },
    },
  },
  '& .MuiInputBase-input': {
    padding: '14px 16px',
    '&::placeholder': {
      color: '#9CA3AF',
      opacity: 1,
    },
  },
  '& .MuiInputLabel-root': {
    fontSize: '14px',
    fontWeight: 500,
    color: '#4B5574',
    '&.Mui-focused': {
      color: hasError ? '#EF4444' : isSuccess ? '#10B981' : '#1852FE',
    },
    '&.Mui-error': {
      color: '#EF4444',
    },
  },
  '& .MuiFormHelperText-root': {
    marginLeft: '4px',
    marginTop: '6px',
    fontSize: '12px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    '&.Mui-error': {
      color: '#EF4444',
    },
  },
});

const StyledInput = ({
  label,
  value,
  onChange,
  error,
  helperText,
  success,
  successText,
  type = 'text',
  placeholder,
  required,
  disabled,
  fullWidth = true,
  size = 'medium',
  startAdornment,
  endAdornment,
  multiline,
  rows,
  maxLength,
  showCharCount,
  autoFocus,
  name,
  inputProps = {},
  sx = {},
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = type === 'password';
  const hasError = Boolean(error);
  const isSuccess = Boolean(success) && !hasError;
  const charCount = value?.length || 0;

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const getEndAdornment = () => {
    if (isPassword) {
      return (
        <InputAdornment position="end">
          <IconButton
            aria-label="toggle password visibility"
            onClick={handleTogglePassword}
            edge="end"
            size="small"
            sx={{ color: '#9CA3AF' }}
          >
            {showPassword ? (
              <VisibilityOffRoundedIcon sx={{ fontSize: 20 }} />
            ) : (
              <VisibilityRoundedIcon sx={{ fontSize: 20 }} />
            )}
          </IconButton>
        </InputAdornment>
      );
    }

    if (hasError && !endAdornment) {
      return (
        <InputAdornment position="end">
          <ErrorRoundedIcon sx={{ fontSize: 20, color: '#EF4444' }} />
        </InputAdornment>
      );
    }

    if (isSuccess && !endAdornment) {
      return (
        <InputAdornment position="end">
          <CheckCircleRoundedIcon sx={{ fontSize: 20, color: '#10B981' }} />
        </InputAdornment>
      );
    }

    return endAdornment;
  };

  const getHelperText = () => {
    if (hasError && helperText) {
      return helperText;
    }
    if (isSuccess && successText) {
      return successText;
    }
    if (showCharCount && maxLength) {
      return `${charCount}/${maxLength}`;
    }
    return helperText;
  };

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      <TextField
        label={label}
        value={value}
        onChange={onChange}
        type={isPassword && showPassword ? 'text' : type}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        fullWidth={fullWidth}
        size={size}
        error={hasError}
        multiline={multiline}
        rows={rows}
        name={name}
        autoFocus={autoFocus}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        helperText={getHelperText()}
        InputProps={{
          startAdornment: startAdornment && (
            <InputAdornment position="start">{startAdornment}</InputAdornment>
          ),
          endAdornment: getEndAdornment(),
          ...inputProps,
        }}
        inputProps={{
          maxLength,
          ...inputProps?.inputProps,
        }}
        sx={{
          ...getInputStyles(hasError, isSuccess, isFocused),
          ...sx,
        }}
        {...props}
      />
    </Box>
  );
};

// Specialized input for currency
export const CurrencyInput = ({
  value,
  onChange,
  label = 'Valor',
  ...props
}) => {
  const formatCurrency = (val) => {
    if (!val) return '';
    const num = val.replace(/\D/g, '');
    const formatted = (parseInt(num, 10) / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatted;
  };

  const handleChange = (e) => {
    const formatted = formatCurrency(e.target.value);
    onChange?.({ target: { value: formatted, name: e.target.name } });
  };

  return (
    <StyledInput
      label={label}
      value={value}
      onChange={handleChange}
      startAdornment={
        <Typography sx={{ color: '#666', fontWeight: 500 }}>R$</Typography>
      }
      inputProps={{ inputMode: 'decimal' }}
      {...props}
    />
  );
};

// Specialized input for phone
export const PhoneInput = ({
  value,
  onChange,
  label = 'Telefone',
  ...props
}) => {
  const formatPhone = (val) => {
    if (!val) return '';
    const num = val.replace(/\D/g, '').slice(0, 11);
    if (num.length <= 2) return num;
    if (num.length <= 7) return `(${num.slice(0, 2)}) ${num.slice(2)}`;
    return `(${num.slice(0, 2)}) ${num.slice(2, 7)}-${num.slice(7)}`;
  };

  const handleChange = (e) => {
    const formatted = formatPhone(e.target.value);
    onChange?.({ target: { value: formatted, name: e.target.name } });
  };

  return (
    <StyledInput
      label={label}
      value={value}
      onChange={handleChange}
      placeholder="(00) 00000-0000"
      inputProps={{ inputMode: 'tel' }}
      {...props}
    />
  );
};

// Specialized input for CPF
export const CPFInput = ({
  value,
  onChange,
  label = 'CPF',
  ...props
}) => {
  const formatCPF = (val) => {
    if (!val) return '';
    const num = val.replace(/\D/g, '').slice(0, 11);
    if (num.length <= 3) return num;
    if (num.length <= 6) return `${num.slice(0, 3)}.${num.slice(3)}`;
    if (num.length <= 9) return `${num.slice(0, 3)}.${num.slice(3, 6)}.${num.slice(6)}`;
    return `${num.slice(0, 3)}.${num.slice(3, 6)}.${num.slice(6, 9)}-${num.slice(9)}`;
  };

  const handleChange = (e) => {
    const formatted = formatCPF(e.target.value);
    onChange?.({ target: { value: formatted, name: e.target.name } });
  };

  return (
    <StyledInput
      label={label}
      value={value}
      onChange={handleChange}
      placeholder="000.000.000-00"
      inputProps={{ inputMode: 'numeric' }}
      {...props}
    />
  );
};

// Specialized input for CEP
export const CEPInput = ({
  value,
  onChange,
  label = 'CEP',
  ...props
}) => {
  const formatCEP = (val) => {
    if (!val) return '';
    const num = val.replace(/\D/g, '').slice(0, 8);
    if (num.length <= 5) return num;
    return `${num.slice(0, 5)}-${num.slice(5)}`;
  };

  const handleChange = (e) => {
    const formatted = formatCEP(e.target.value);
    onChange?.({ target: { value: formatted, name: e.target.name } });
  };

  return (
    <StyledInput
      label={label}
      value={value}
      onChange={handleChange}
      placeholder="00000-000"
      inputProps={{ inputMode: 'numeric' }}
      {...props}
    />
  );
};

export default StyledInput;
