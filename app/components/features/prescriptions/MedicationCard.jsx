'use client';

/**
 * MedicationCard - Card minimalista de medicamento
 *
 * Design consistente com DashboardTemplate/ModernWidgets
 * - Sombras sutis ao inves de bordas
 * - Transicoes suaves
 * - Cores semanticas por tipo de controlado
 */

import React, { memo } from 'react';
import { cn } from '@/lib/utils';
import {
    Pill,
    Star,
    Edit2,
    Trash2,
    Plus,
    AlertTriangle,
    Clock
} from 'lucide-react';

// Cores por tipo de medicamento controlado
const MEDICATION_COLORS = {
    none: {
        bg: 'bg-slate-50',
        icon: 'bg-blue-50 text-blue-600',
        badge: 'bg-slate-100 text-slate-600',
        border: 'border-slate-200'
    },
    a: {
        bg: 'bg-amber-50/50',
        icon: 'bg-amber-100 text-amber-600',
        badge: 'bg-amber-100 text-amber-700',
        border: 'border-amber-200'
    },
    b1: {
        bg: 'bg-sky-50/50',
        icon: 'bg-sky-100 text-sky-600',
        badge: 'bg-sky-100 text-sky-700',
        border: 'border-sky-200'
    },
    b2: {
        bg: 'bg-sky-50/50',
        icon: 'bg-sky-100 text-sky-600',
        badge: 'bg-sky-100 text-sky-700',
        border: 'border-sky-200'
    },
    c1: {
        bg: 'bg-indigo-50/50',
        icon: 'bg-indigo-100 text-indigo-600',
        badge: 'bg-indigo-100 text-indigo-700',
        border: 'border-indigo-200'
    },
    antimicrobial: {
        bg: 'bg-purple-50/50',
        icon: 'bg-purple-100 text-purple-600',
        badge: 'bg-purple-100 text-purple-700',
        border: 'border-purple-200'
    },
};

const CONTROLLED_LABELS = {
    none: null,
    a: 'Lista A',
    b1: 'Lista B1',
    b2: 'Lista B2',
    c1: 'Lista C1',
    antimicrobial: 'Antimicrobiano',
};

/**
 * MedicationCard - Card de medicamento para lista de receita
 */
export const MedicationCard = memo(({
    medication,
    onEdit,
    onRemove,
    onToggleFavorite,
    showActions = true,
    compact = false,
    className
}) => {
    const controlledType = medication.controlledType || 'none';
    const colors = MEDICATION_COLORS[controlledType] || MEDICATION_COLORS.none;
    const controlledLabel = CONTROLLED_LABELS[controlledType];

    return (
        <div
            className={cn(
                "group relative bg-white rounded-xl shadow-sm hover:shadow-md",
                "transition-all duration-300 ease-out",
                compact ? "p-3" : "p-4",
                className
            )}
        >
            {/* Badge de controlado */}
            {controlledLabel && (
                <div className="absolute top-2 right-2">
                    <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full",
                        colors.badge
                    )}>
                        <AlertTriangle className="w-3 h-3" />
                        {controlledLabel}
                    </span>
                </div>
            )}

            {/* Favorito */}
            {onToggleFavorite && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(medication);
                    }}
                    className={cn(
                        "absolute top-2 transition-all duration-200",
                        controlledLabel ? "right-24" : "right-2",
                        medication.isFavorite
                            ? "text-amber-400"
                            : "text-slate-300 opacity-0 group-hover:opacity-100"
                    )}
                >
                    <Star
                        className={cn(
                            "w-4 h-4",
                            medication.isFavorite && "fill-amber-400"
                        )}
                    />
                </button>
            )}

            <div className="flex items-start gap-3">
                {/* Icone do medicamento */}
                <div className={cn(
                    "flex-shrink-0 rounded-lg flex items-center justify-center",
                    compact ? "w-8 h-8" : "w-10 h-10",
                    colors.icon
                )}>
                    <Pill className={compact ? "w-4 h-4" : "w-5 h-5"} />
                </div>

                {/* Informacoes */}
                <div className="flex-1 min-w-0 pr-8">
                    <h4 className={cn(
                        "font-medium text-slate-800 truncate",
                        compact ? "text-sm" : "text-base"
                    )}>
                        {medication.name || medication.drugName || medication.medicationName}
                    </h4>

                    {medication.concentration && (
                        <p className="text-sm text-slate-500 mt-0.5">
                            {medication.concentration}
                        </p>
                    )}

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {medication.dosage && (
                            <span className="inline-flex items-center text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                {medication.dosage}
                            </span>
                        )}
                        {medication.quantity && (
                            <span className="inline-flex items-center text-xs text-slate-500">
                                {medication.quantity} {medication.unit || 'un'}
                            </span>
                        )}
                        {medication.duration && (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                                <Clock className="w-3 h-3" />
                                {medication.duration}
                            </span>
                        )}
                    </div>

                    {medication.instructions && !compact && (
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                            {medication.instructions}
                        </p>
                    )}
                </div>
            </div>

            {/* Acoes (hover) */}
            {showActions && (onEdit || onRemove) && (
                <div className={cn(
                    "absolute right-2 flex gap-1",
                    "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                    compact ? "bottom-2" : "bottom-3"
                )}>
                    {onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(medication);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <Edit2 className="w-4 h-4 text-slate-500" />
                        </button>
                    )}
                    {onRemove && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove(medication);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
});

MedicationCard.displayName = 'MedicationCard';

/**
 * QuickSelectCard - Card compacto para selecao rapida
 */
export const QuickSelectCard = memo(({
    medication,
    onSelect,
    onToggleFavorite,
    isSelected = false,
    className
}) => {
    const controlledType = medication.controlledType || 'none';
    const colors = MEDICATION_COLORS[controlledType] || MEDICATION_COLORS.none;

    return (
        <button
            onClick={() => onSelect(medication)}
            className={cn(
                "relative w-full text-left bg-white rounded-xl p-3",
                "transition-all duration-300 ease-out",
                "hover:shadow-md hover:-translate-y-0.5",
                isSelected
                    ? "shadow-lg ring-2 ring-primary/30"
                    : "shadow-sm",
                className
            )}
        >
            {/* Indicador de favorito */}
            {medication.isFavorite && (
                <Star className="absolute top-2 right-2 w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            )}

            <div className="flex items-center gap-2.5">
                <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    colors.icon
                )}>
                    <Pill className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">
                        {medication.name || medication.drugName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                        {medication.defaultDosage || medication.dosage || medication.concentration}
                    </p>
                </div>
            </div>

            {/* Indicador de controlado */}
            {controlledType !== 'none' && (
                <div className={cn(
                    "absolute bottom-1 left-1 right-1 h-1 rounded-full",
                    colors.badge.replace('text-', 'bg-').replace('100', '200')
                )} />
            )}
        </button>
    );
});

QuickSelectCard.displayName = 'QuickSelectCard';

/**
 * MedicationPill - Pill minimalista para favoritos
 */
export const MedicationPill = memo(({
    medication,
    onSelect,
    onRemove,
    className
}) => {
    const controlledType = medication.controlledType || 'none';
    const colors = MEDICATION_COLORS[controlledType] || MEDICATION_COLORS.none;

    return (
        <button
            onClick={() => onSelect(medication)}
            className={cn(
                "group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                "bg-white shadow-sm hover:shadow-md",
                "transition-all duration-200 ease-out",
                "hover:-translate-y-0.5",
                controlledType !== 'none' && `border ${colors.border}`,
                className
            )}
        >
            <Plus className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-slate-700">
                {medication.name || medication.drugName}
            </span>
            {medication.concentration && (
                <span className="text-xs text-slate-400">
                    {medication.concentration}
                </span>
            )}
        </button>
    );
});

MedicationPill.displayName = 'MedicationPill';

export default MedicationCard;
