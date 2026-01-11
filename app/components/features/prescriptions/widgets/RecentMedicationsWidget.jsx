'use client';

/**
 * RecentMedicationsWidget - Widget de medicamentos usados recentemente
 *
 * Design consistente com sidebar do DashboardTemplate
 */

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import {
    Clock,
    Plus,
    Pill,
    Star,
    History,
    Loader2
} from 'lucide-react';
import { useRecentMedications, useFavorites } from '../../../hooks/useMedicationFavorites';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * RecentMedicationsWidget - Widget para sidebar
 */
export const RecentMedicationsWidget = memo(({
    onSelectMedication,
    maxItems = 5,
    className
}) => {
    const { medications, isLoading } = useRecentMedications();
    const { toggle, check } = useFavorites();

    const displayedMedications = medications.slice(0, maxItems);
    const hasMore = medications.length > maxItems;

    return (
        <div className={cn(
            "bg-white rounded-xl shadow-sm overflow-hidden",
            className
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Recentes
                </h3>
                {medications.length > 0 && (
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {medications.length}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-3">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                    </div>
                ) : medications.length === 0 ? (
                    <EmptyRecent />
                ) : (
                    <div className="space-y-1">
                        {displayedMedications.map((med, index) => (
                            <RecentItem
                                key={med.id || index}
                                medication={med}
                                isFavorite={check(med)}
                                onSelect={() => onSelectMedication?.(med)}
                                onToggleFavorite={() => toggle(med)}
                            />
                        ))}

                        {hasMore && (
                            <button className="w-full py-2 text-xs text-primary hover:text-primary/80 transition-colors">
                                Ver todos ({medications.length})
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

RecentMedicationsWidget.displayName = 'RecentMedicationsWidget';

/**
 * RecentItem - Item individual de recente
 */
const RecentItem = memo(({ medication, isFavorite, onSelect, onToggleFavorite }) => {
    const timeAgo = medication.usedAt
        ? formatDistanceToNow(new Date(medication.usedAt), {
            addSuffix: true,
            locale: ptBR,
        })
        : null;

    return (
        <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg",
            "hover:bg-slate-50 transition-colors duration-200",
            "group"
        )}>
            {/* Icon */}
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                <Pill className="w-4 h-4 text-slate-500" />
            </div>

            {/* Info */}
            <button
                onClick={onSelect}
                className="flex-1 min-w-0 text-left"
            >
                <p className="text-sm font-medium text-slate-700 truncate">
                    {medication.name || medication.drugName}
                </p>
                <p className="text-xs text-slate-400 truncate">
                    {medication.dosage || medication.concentration || timeAgo || 'Usado recentemente'}
                </p>
            </button>

            {/* Actions */}
            <div className="flex items-center gap-1">
                {/* Favorite toggle */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite();
                    }}
                    className={cn(
                        "p-1.5 rounded-lg transition-all duration-200",
                        isFavorite
                            ? "text-amber-400"
                            : "text-slate-300 opacity-0 group-hover:opacity-100 hover:text-amber-400"
                    )}
                >
                    <Star className={cn("w-4 h-4", isFavorite && "fill-amber-400")} />
                </button>

                {/* Add */}
                <button
                    onClick={onSelect}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-primary hover:bg-primary/5 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
});

RecentItem.displayName = 'RecentItem';

/**
 * EmptyRecent - Estado vazio
 */
const EmptyRecent = memo(() => (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-3">
            <History className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-sm text-slate-500 mb-1">
            Nenhum medicamento recente
        </p>
        <p className="text-xs text-slate-400">
            Seus medicamentos usados aparecerao aqui
        </p>
    </div>
));

EmptyRecent.displayName = 'EmptyRecent';

export default RecentMedicationsWidget;
