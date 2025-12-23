'use client';

import { useState, useCallback } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { useTussAutocomplete } from '../../hooks/useTussAutocomplete';

const TIPO_COLORS = {
  procedimento: 'primary',
  material: 'secondary',
  medicamento: 'success',
  diaria_taxa: 'warning',
};

const TIPO_LABELS = {
  procedimento: 'Procedimento',
  material: 'Material',
  medicamento: 'Medicamento',
  diaria_taxa: 'Diária/Taxa',
};

export default function TussAutocomplete({
  value,
  onChange,
  tipo = null,
  label = 'Código TUSS',
  placeholder = 'Digite o código ou descrição...',
  required = false,
  error = false,
  helperText = '',
  disabled = false,
  fullWidth = true,
  size = 'medium',
}) {
  const { results, loading, search, clear } = useTussAutocomplete({ tipo });
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = useCallback(
    (event, newInputValue) => {
      setInputValue(newInputValue);
      if (newInputValue.length >= 2) {
        search(newInputValue);
      } else {
        clear();
      }
    },
    [search, clear]
  );

  const handleChange = useCallback(
    (event, newValue) => {
      if (onChange) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Autocomplete
      value={value}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      options={results}
      loading={loading}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : `${option.codigo} - ${option.termo}`
      }
      isOptionEqualToValue={(option, value) => option.codigo === value?.codigo}
      filterOptions={(x) => x} // Disable built-in filtering
      noOptionsText={
        inputValue.length < 2
          ? 'Digite pelo menos 2 caracteres'
          : 'Nenhum código encontrado'
      }
      loadingText="Buscando..."
      renderOption={(props, option) => {
        const { key, ...otherProps } = props;
        return (
          <Box
            component="li"
            key={option.codigo}
            {...otherProps}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <Typography variant="body2" fontWeight="bold">
                {option.codigo}
              </Typography>
              <Chip
                label={TIPO_LABELS[option.tipo] || option.tipo}
                color={TIPO_COLORS[option.tipo] || 'default'}
                size="small"
                variant="outlined"
              />
              {option.valor_referencia && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                  {formatCurrency(option.valor_referencia)}
                </Typography>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {option.termo}
            </Typography>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
