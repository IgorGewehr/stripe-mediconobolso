'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { useTiss } from '../../hooks/useTiss';

export default function OperadoraSelect({
  value,
  onChange,
  label = 'Operadora',
  placeholder = 'Selecione a operadora...',
  required = false,
  error = false,
  helperText = '',
  disabled = false,
  fullWidth = true,
  size = 'medium',
}) {
  const { operadoras, loading, fetchOperadoras, searchOperadoras } = useTiss();
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);

  useEffect(() => {
    setOptions(operadoras);
  }, [operadoras]);

  const handleInputChange = useCallback(
    async (event, newInputValue) => {
      setInputValue(newInputValue);

      if (newInputValue.length >= 2) {
        const results = await searchOperadoras(newInputValue);
        setOptions(results);
      } else {
        setOptions(operadoras);
      }
    },
    [operadoras, searchOperadoras]
  );

  const handleChange = useCallback(
    (event, newValue) => {
      if (onChange) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  return (
    <Autocomplete
      value={value}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      options={options}
      loading={loading}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.nome_fantasia
      }
      isOptionEqualToValue={(option, value) => option.id === value?.id}
      noOptionsText="Nenhuma operadora encontrada"
      loadingText="Carregando..."
      renderOption={(props, option) => {
        const { key, ...otherProps } = props;
        return (
          <Box
            component="li"
            key={option.id}
            {...otherProps}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', py: 1 }}
          >
            <Typography variant="body2" fontWeight="medium">
              {option.nome_fantasia}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="caption" color="text.secondary">
                ANS: {option.codigo_ans}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                CNPJ: {option.cnpj}
              </Typography>
            </Box>
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
