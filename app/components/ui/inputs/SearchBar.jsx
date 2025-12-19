"use client";

import React, { useRef, useState, useCallback } from 'react';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

// Componente SearchBar isolado para evitar re-renderizações desnecessárias
const SearchBar = React.memo(({ onSearch, placeholder = "Buscar pacientes por nome, e-mail ou CPF...", isTablet }) => {
    const [localSearchTerm, setLocalSearchTerm] = useState('');
    const inputRef = useRef(null);
    const debounceTimerRef = useRef(null);

    // Usando debounce para evitar atualizações frequentes
    const handleChange = useCallback((e) => {
        const value = e.target.value;
        setLocalSearchTerm(value);

        // Limpa o timer anterior
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Define um novo timer para atualizar a busca após 300ms
        debounceTimerRef.current = setTimeout(() => {
            onSearch(value);
        }, 300);
    }, [onSearch]);

    return (
        <div style={{
            position: 'relative',
            flex: '1 1 60%',
            maxWidth: '600px',
            transformOrigin: 'top left',
        }}>
            <TextField
                inputRef={inputRef}
                placeholder={placeholder}
                value={localSearchTerm}
                onChange={handleChange}
                variant="outlined"
                fullWidth
                sx={{
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
                        }
                    }
                }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon color={localSearchTerm ? 'primary' : 'inherit'} />
                        </InputAdornment>
                    ),
                }}
                size="small"
            />
        </div>
    );
});

export default SearchBar;