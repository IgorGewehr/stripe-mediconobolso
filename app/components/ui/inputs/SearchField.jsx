"use client";

import React, { useState, useCallback } from 'react';
import debounce from 'lodash.debounce';
import { TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

const SearchField = ({ searchTerm, setSearchTerm, setPage, isTablet, theme }) => {
    const [localSearch, setLocalSearch] = useState(searchTerm);

    // Cria uma função debounced que atualiza o estado global de busca e reseta a página
    const debouncedUpdate = useCallback(
        debounce((value) => {
            setSearchTerm(value);
            setPage(1);
        }, 300),
        [setSearchTerm, setPage]
    );

    const handleChange = (event) => {
        const value = event.target.value;
        setLocalSearch(value);
        debouncedUpdate(value);
    };

    return (
        <TextField
            placeholder="Buscar pacientes por nome, e-mail ou CPF..."
            value={localSearch}
            onChange={handleChange}
            variant="outlined"
            fullWidth
            size="small"
            sx={{
                flex: { xs: '1', md: '1 1 60%' },
                maxWidth: { md: '600px' },
                '& .MuiOutlinedInput-root': {
                    borderRadius: '50px',
                    backgroundColor: '#fff',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'box-shadow 0.2s ease',
                    '&:hover': {
                        boxShadow: '0 3px 12px rgba(0,0,0,0.12)',
                    },
                    '&.Mui-focused': {
                        boxShadow: '0 3px 12px rgba(24,82,254,0.15)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                    }
                }
            }}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon color={localSearch ? 'primary' : 'inherit'} />
                    </InputAdornment>
                ),
            }}
        />
    );
};

export default React.memo(SearchField);
