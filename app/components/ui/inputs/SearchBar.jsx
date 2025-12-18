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
            flex: isTablet ? '1' : '1 1 50%',
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
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }
                }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
                size="small"
            />
        </div>
    );
});

export default SearchBar;