'use client';

/**
 * useMedicationFavorites - Hook para gerenciar medicamentos favoritos e recentes
 *
 * Features:
 * - Sync com backend quando disponivel
 * - Fallback para localStorage
 * - Cache em memoria para performance
 * - Otimistic updates
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { prescriptionsService } from '@/lib/services/api';

/**
 * Hook principal para favoritos e recentes
 */
export function useMedicationFavorites() {
    const [favorites, setFavorites] = useState([]);
    const [recentMedications, setRecentMedications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const isMounted = useRef(true);
    const hasLoaded = useRef(false);

    // Carregar dados iniciais
    useEffect(() => {
        isMounted.current = true;

        const loadData = async () => {
            if (hasLoaded.current) return;
            hasLoaded.current = true;

            setIsLoading(true);
            setError(null);

            try {
                const [favs, recent] = await Promise.all([
                    prescriptionsService.listFavoriteMedications().catch(() => []),
                    prescriptionsService.getRecentMedications(10).catch(() => []),
                ]);

                if (isMounted.current) {
                    // Marcar favoritos
                    const favIds = new Set(favs.map(f => f.id || f.name));
                    const recentWithFav = recent.map(r => ({
                        ...r,
                        isFavorite: favIds.has(r.id) || favIds.has(r.name),
                    }));

                    setFavorites(favs.map(f => ({ ...f, isFavorite: true })));
                    setRecentMedications(recentWithFav);
                }
            } catch (err) {
                console.error('Erro ao carregar medicamentos:', err);
                if (isMounted.current) {
                    setError(err);
                }
            } finally {
                if (isMounted.current) {
                    setIsLoading(false);
                }
            }
        };

        loadData();

        return () => {
            isMounted.current = false;
        };
    }, []);

    /**
     * Adicionar medicamento aos favoritos
     */
    const addFavorite = useCallback(async (medication) => {
        // Optimistic update
        const medWithFavorite = { ...medication, isFavorite: true };

        setFavorites(prev => {
            const exists = prev.some(f => f.id === medication.id || f.name === medication.name);
            if (exists) return prev;
            return [medWithFavorite, ...prev];
        });

        setRecentMedications(prev =>
            prev.map(r =>
                r.id === medication.id || r.name === medication.name
                    ? { ...r, isFavorite: true }
                    : r
            )
        );

        try {
            await prescriptionsService.addFavoriteMedication(medication);
        } catch (err) {
            console.error('Erro ao adicionar favorito:', err);
            // Nao reverte - localStorage ja salvou
        }
    }, []);

    /**
     * Remover medicamento dos favoritos
     */
    const removeFavorite = useCallback(async (medication) => {
        const medId = medication.id || medication.name;

        // Optimistic update
        setFavorites(prev => prev.filter(f => f.id !== medId && f.name !== medId));

        setRecentMedications(prev =>
            prev.map(r =>
                r.id === medId || r.name === medId
                    ? { ...r, isFavorite: false }
                    : r
            )
        );

        try {
            await prescriptionsService.removeFavoriteMedication(medId);
        } catch (err) {
            console.error('Erro ao remover favorito:', err);
            // Nao reverte - localStorage ja salvou
        }
    }, []);

    /**
     * Toggle favorito
     */
    const toggleFavorite = useCallback(async (medication) => {
        const isFavorite = favorites.some(f =>
            f.id === medication.id || f.name === medication.name
        );

        if (isFavorite) {
            await removeFavorite(medication);
        } else {
            await addFavorite(medication);
        }
    }, [favorites, addFavorite, removeFavorite]);

    /**
     * Verificar se medicamento é favorito
     */
    const isFavorite = useCallback((medication) => {
        return favorites.some(f =>
            f.id === medication.id ||
            f.name === medication.name ||
            f.drugName === medication.drugName
        );
    }, [favorites]);

    /**
     * Registrar uso de medicamento (atualiza recentes)
     */
    const trackUsage = useCallback(async (medication) => {
        const medWithDate = {
            ...medication,
            usedAt: new Date().toISOString(),
            isFavorite: isFavorite(medication),
        };

        // Optimistic update - adiciona no topo
        setRecentMedications(prev => {
            const filtered = prev.filter(r =>
                r.id !== medication.id && r.name !== medication.name
            );
            return [medWithDate, ...filtered].slice(0, 20);
        });

        // Salva no service (localStorage + backend)
        try {
            await prescriptionsService.trackMedicationUsage(medication);
        } catch (err) {
            console.error('Erro ao registrar uso:', err);
        }
    }, [isFavorite]);

    /**
     * Recarregar dados
     */
    const refresh = useCallback(async () => {
        hasLoaded.current = false;
        setIsLoading(true);

        try {
            const [favs, recent] = await Promise.all([
                prescriptionsService.listFavoriteMedications().catch(() => []),
                prescriptionsService.getRecentMedications(10).catch(() => []),
            ]);

            const favIds = new Set(favs.map(f => f.id || f.name));
            const recentWithFav = recent.map(r => ({
                ...r,
                isFavorite: favIds.has(r.id) || favIds.has(r.name),
            }));

            setFavorites(favs.map(f => ({ ...f, isFavorite: true })));
            setRecentMedications(recentWithFav);
        } catch (err) {
            console.error('Erro ao recarregar:', err);
            setError(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        favorites,
        recentMedications,
        isLoading,
        error,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        trackUsage,
        refresh,
    };
}

/**
 * Hook simplificado apenas para favoritos
 */
export function useFavorites() {
    const { favorites, isLoading, addFavorite, removeFavorite, toggleFavorite, isFavorite } =
        useMedicationFavorites();

    return {
        favorites,
        isLoading,
        add: addFavorite,
        remove: removeFavorite,
        toggle: toggleFavorite,
        check: isFavorite,
    };
}

/**
 * Hook simplificado apenas para recentes
 */
export function useRecentMedications() {
    const { recentMedications, isLoading, trackUsage, refresh } = useMedicationFavorites();

    return {
        medications: recentMedications,
        isLoading,
        track: trackUsage,
        refresh,
    };
}

export default useMedicationFavorites;
