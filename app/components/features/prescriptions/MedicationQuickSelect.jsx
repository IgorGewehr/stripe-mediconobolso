'use client';

/**
 * MedicationQuickSelect - Grid de selecao rapida de medicamentos
 *
 * Features:
 * - Favoritos em formato de pills
 * - Recentes em grid de cards
 * - 1 clique para adicionar
 * - Visual minimalista
 */

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import {
    Star,
    Clock,
    Plus,
    Sparkles,
    ChevronRight
} from 'lucide-react';
import { QuickSelectCard, MedicationPill } from './MedicationCard';

/**
 * MedicationQuickSelect - Componente principal de selecao rapida
 */
export const MedicationQuickSelect = memo(({
    favorites = [],
    recentMedications = [],
    onSelect,
    onToggleFavorite,
    isLoading = false,
    className
}) => {
    const hasFavorites = favorites.length > 0;
    const hasRecent = recentMedications.length > 0;
    const isEmpty = !hasFavorites && !hasRecent;

    if (isEmpty && !isLoading) {
        return (
            <EmptyState onAddFirst={() => {}} />
        );
    }

    return (
        <div className={cn("space-y-6", className)}>
            {/* Favoritos */}
            {hasFavorites && (
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <h3 className="text-sm font-medium text-slate-600">Favoritos</h3>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {favorites.map((med, index) => (
                            <MedicationPill
                                key={med.id || index}
                                medication={med}
                                onSelect={onSelect}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Recentes */}
            {hasRecent && (
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <h3 className="text-sm font-medium text-slate-600">Usados recentemente</h3>
                    </div>

                    {/* Grid responsivo */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {recentMedications.slice(0, 8).map((med, index) => (
                            <QuickSelectCard
                                key={med.id || index}
                                medication={med}
                                onSelect={onSelect}
                                onToggleFavorite={onToggleFavorite}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Loading skeleton */}
            {isLoading && (
                <LoadingSkeleton />
            )}
        </div>
    );
});

MedicationQuickSelect.displayName = 'MedicationQuickSelect';

/**
 * EmptyState - Estado vazio elegante
 */
const EmptyState = memo(({ onAddFirst }) => (
    <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-primary/60" />
        </div>

        <h3 className="text-base font-medium text-slate-700 mb-1">
            Nenhum medicamento recente
        </h3>
        <p className="text-sm text-slate-500 text-center max-w-xs mb-4">
            Seus medicamentos mais usados aparecerao aqui para adicao rapida
        </p>

        <button
            onClick={onAddFirst}
            className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary/10 text-primary hover:bg-primary/20",
                "transition-colors duration-200",
                "text-sm font-medium"
            )}
        >
            <Plus className="w-4 h-4" />
            Buscar medicamento
        </button>
    </div>
));

EmptyState.displayName = 'EmptyState';

/**
 * LoadingSkeleton - Skeleton de carregamento
 */
const LoadingSkeleton = memo(() => (
    <div className="space-y-6 animate-pulse">
        {/* Skeleton favoritos */}
        <div>
            <div className="h-4 w-24 bg-slate-200 rounded mb-3" />
            <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-8 w-28 bg-slate-100 rounded-full" />
                ))}
            </div>
        </div>

        {/* Skeleton grid */}
        <div>
            <div className="h-4 w-32 bg-slate-200 rounded mb-3" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-20 bg-slate-100 rounded-xl" />
                ))}
            </div>
        </div>
    </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

/**
 * QuickSelectHeader - Header com titulo e acao
 */
export const QuickSelectHeader = memo(({
    title,
    icon: Icon,
    action,
    onAction,
    className
}) => (
    <div className={cn("flex items-center justify-between mb-4", className)}>
        <div className="flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5 text-slate-400" />}
            <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        </div>

        {action && onAction && (
            <button
                onClick={onAction}
                className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium",
                    "text-primary hover:text-primary/80",
                    "transition-colors duration-200"
                )}
            >
                {action}
                <ChevronRight className="w-3.5 h-3.5" />
            </button>
        )}
    </div>
));

QuickSelectHeader.displayName = 'QuickSelectHeader';

/**
 * MobileQuickSelect - Versao mobile com scroll horizontal
 */
export const MobileQuickSelect = memo(({
    medications = [],
    onSelect,
    className
}) => (
    <div className={cn("md:hidden", className)}>
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x scrollbar-hide">
            {medications.map((med, index) => (
                <div key={med.id || index} className="snap-start shrink-0 w-[140px]">
                    <QuickSelectCard
                        medication={med}
                        onSelect={onSelect}
                        className="h-full"
                    />
                </div>
            ))}
        </div>
    </div>
));

MobileQuickSelect.displayName = 'MobileQuickSelect';

export default MedicationQuickSelect;
