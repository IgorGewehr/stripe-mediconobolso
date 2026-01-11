'use client';

/**
 * FavoriteMedicationsWidget - Widget de medicamentos favoritos
 *
 * Design consistente com sidebar do DashboardTemplate
 */

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import {
    Star,
    Plus,
    Pill,
    Sparkles,
    Loader2
} from 'lucide-react';
import { useFavorites } from '../../../hooks/useMedicationFavorites';

/**
 * FavoriteMedicationsWidget - Widget para sidebar
 */
export const FavoriteMedicationsWidget = memo(({
    onSelectMedication,
    maxItems = 5,
    className
}) => {
    const { favorites, isLoading, remove } = useFavorites();

    const displayedFavorites = favorites.slice(0, maxItems);
    const hasMore = favorites.length > maxItems;

    return (
        <div className={cn(
            "bg-white rounded-xl shadow-sm overflow-hidden",
            className
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    Favoritos
                </h3>
                {favorites.length > 0 && (
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {favorites.length}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-3">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                    </div>
                ) : favorites.length === 0 ? (
                    <EmptyFavorites />
                ) : (
                    <div className="space-y-1">
                        {displayedFavorites.map((med, index) => (
                            <FavoriteItem
                                key={med.id || index}
                                medication={med}
                                onSelect={() => onSelectMedication?.(med)}
                                onRemove={() => remove(med)}
                            />
                        ))}

                        {hasMore && (
                            <button className="w-full py-2 text-xs text-primary hover:text-primary/80 transition-colors">
                                Ver todos ({favorites.length})
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

FavoriteMedicationsWidget.displayName = 'FavoriteMedicationsWidget';

/**
 * FavoriteItem - Item individual de favorito
 */
const FavoriteItem = memo(({ medication, onSelect, onRemove }) => (
    <button
        onClick={onSelect}
        className={cn(
            "w-full flex items-center gap-3 p-3 rounded-lg",
            "hover:bg-slate-50 transition-colors duration-200",
            "text-left group"
        )}
    >
        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Pill className="w-4 h-4 text-blue-600" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">
                {medication.name || medication.drugName}
            </p>
            {medication.defaultDosage && (
                <p className="text-xs text-slate-400 truncate">
                    {medication.defaultDosage}
                </p>
            )}
        </div>

        {/* Add icon */}
        <Plus className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
    </button>
));

FavoriteItem.displayName = 'FavoriteItem';

/**
 * EmptyFavorites - Estado vazio
 */
const EmptyFavorites = memo(() => (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-sm text-slate-500 mb-1">
            Nenhum favorito ainda
        </p>
        <p className="text-xs text-slate-400">
            Marque medicamentos com estrela para acesso rapido
        </p>
    </div>
));

EmptyFavorites.displayName = 'EmptyFavorites';

export default FavoriteMedicationsWidget;
