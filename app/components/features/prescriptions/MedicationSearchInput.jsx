'use client';

/**
 * MedicationSearchInput - Autocomplete de medicamentos com debounce
 *
 * Features:
 * - Busca com debounce (300ms)
 * - Sugestoes do banco de dados
 * - Visual indicando tipo de controlado
 * - Design minimalista consistente com DashboardTemplate
 */

import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import {
    Search,
    Pill,
    X,
    Loader2,
    AlertTriangle,
    ChevronDown
} from 'lucide-react';
import { prescriptionsService } from '@/lib/services/api';

// Cores por tipo de medicamento
const CONTROLLED_COLORS = {
    none: { bg: 'bg-slate-50', text: 'text-slate-600' },
    a: { bg: 'bg-amber-50', text: 'text-amber-700' },
    b1: { bg: 'bg-sky-50', text: 'text-sky-700' },
    b2: { bg: 'bg-sky-50', text: 'text-sky-700' },
    c1: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
    antimicrobial: { bg: 'bg-purple-50', text: 'text-purple-700' },
};

const CONTROLLED_LABELS = {
    a: 'Lista A',
    b1: 'Lista B1',
    b2: 'Lista B2',
    c1: 'Lista C1',
    antimicrobial: 'Antimicrobiano',
};

// Debounce hook
function useDebounce(value, delay = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * MedicationSearchInput - Campo de busca com autocomplete
 */
export const MedicationSearchInput = memo(({
    value = '',
    onChange,
    onSelect,
    placeholder = 'Buscar medicamento...',
    autoFocus = false,
    disabled = false,
    className
}) => {
    const [inputValue, setInputValue] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const inputRef = useRef(null);
    const listRef = useRef(null);
    const containerRef = useRef(null);

    const debouncedSearch = useDebounce(inputValue, 300);

    // Buscar sugestoes quando o termo mudar
    useEffect(() => {
        const searchMedications = async () => {
            if (!debouncedSearch || debouncedSearch.length < 2) {
                setSuggestions([]);
                return;
            }

            setIsLoading(true);
            try {
                const results = await prescriptionsService.searchMedications(debouncedSearch);
                setSuggestions(results || []);
            } catch (error) {
                console.error('Erro ao buscar medicamentos:', error);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        };

        searchMedications();
    }, [debouncedSearch]);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handlers
    const handleInputChange = useCallback((e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        setIsOpen(true);
        setHighlightedIndex(-1);
        onChange?.(newValue);
    }, [onChange]);

    const handleSelect = useCallback((medication) => {
        const name = medication.name || medication.drugName || medication.medicationName;
        setInputValue(name);
        setIsOpen(false);
        onSelect?.(medication);
    }, [onSelect]);

    const handleClear = useCallback(() => {
        setInputValue('');
        setSuggestions([]);
        setIsOpen(false);
        onChange?.('');
        inputRef.current?.focus();
    }, [onChange]);

    const handleKeyDown = useCallback((e) => {
        if (!isOpen || suggestions.length === 0) {
            if (e.key === 'ArrowDown') {
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < suggestions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : suggestions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
                    handleSelect(suggestions[highlightedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setHighlightedIndex(-1);
                break;
        }
    }, [isOpen, suggestions, highlightedIndex, handleSelect]);

    // Scroll para item destacado
    useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const item = listRef.current.children[highlightedIndex];
            if (item) {
                item.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlightedIndex]);

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            {/* Input */}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Search className="w-5 h-5" />
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => inputValue.length >= 2 && setIsOpen(true)}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    disabled={disabled}
                    className={cn(
                        "w-full h-12 pl-11 pr-10 rounded-xl",
                        "bg-white border border-slate-200",
                        "text-slate-800 placeholder:text-slate-400",
                        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                        "transition-all duration-200",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                />

                {/* Botao limpar */}
                {inputValue && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Dropdown de sugestoes */}
            {isOpen && (suggestions.length > 0 || isLoading) && (
                <div className={cn(
                    "absolute z-50 w-full mt-2 py-2",
                    "bg-white rounded-xl shadow-lg border border-slate-100",
                    "max-h-64 overflow-y-auto",
                    "animate-in fade-in-0 zoom-in-95 duration-200"
                )}>
                    <ul ref={listRef} role="listbox">
                        {suggestions.map((medication, index) => {
                            const controlledType = medication.controlledType || 'none';
                            const colors = CONTROLLED_COLORS[controlledType];
                            const label = CONTROLLED_LABELS[controlledType];

                            return (
                                <li
                                    key={medication.id || index}
                                    role="option"
                                    aria-selected={highlightedIndex === index}
                                    onClick={() => handleSelect(medication)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 cursor-pointer",
                                        "transition-colors duration-150",
                                        highlightedIndex === index
                                            ? "bg-slate-50"
                                            : "hover:bg-slate-50"
                                    )}
                                >
                                    {/* Icone */}
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                        colors.bg, colors.text
                                    )}>
                                        <Pill className="w-4 h-4" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">
                                            {medication.name || medication.drugName}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {medication.concentration || medication.activeIngredient || 'Medicamento'}
                                        </p>
                                    </div>

                                    {/* Badge controlado */}
                                    {label && (
                                        <span className={cn(
                                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                            colors.bg, colors.text
                                        )}>
                                            <AlertTriangle className="w-3 h-3" />
                                            {label}
                                        </span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>

                    {/* Mensagem de carregamento */}
                    {isLoading && suggestions.length === 0 && (
                        <div className="px-3 py-4 text-center text-sm text-slate-500">
                            Buscando medicamentos...
                        </div>
                    )}
                </div>
            )}

            {/* Mensagem quando nao encontrar */}
            {isOpen && !isLoading && inputValue.length >= 2 && suggestions.length === 0 && (
                <div className={cn(
                    "absolute z-50 w-full mt-2 py-4 px-3",
                    "bg-white rounded-xl shadow-lg border border-slate-100",
                    "text-center"
                )}>
                    <p className="text-sm text-slate-500">
                        Nenhum medicamento encontrado
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        Digite o nome para adicionar manualmente
                    </p>
                </div>
            )}
        </div>
    );
});

MedicationSearchInput.displayName = 'MedicationSearchInput';

export default MedicationSearchInput;
