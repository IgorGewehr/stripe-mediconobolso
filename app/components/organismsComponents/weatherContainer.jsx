"use client";

import React, { useEffect, useState } from "react";
import { Skeleton, Box, Typography, Button } from "@mui/material";
import { useAuth } from "../authProvider";
import WeatherCard from "../basicComponents/weatherCard";
import firebaseService from "../../../lib/firebaseService";
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * WeatherContainer Componente - Versão simplificada e confiável
 *
 * Regras:
 * 1. Sempre mostra dados do Firebase imediatamente (se disponíveis)
 * 2. Atualiza apenas em background se dados forem antigos
 * 3. Nunca fica em estado de loading infinito
 */

const WeatherContainer = () => {
    const { user } = useAuth();
    const [weatherData, setWeatherData] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(0);

    // Carregar e possivelmente atualizar dados do clima
    useEffect(() => {
        let isMounted = true;

        const loadWeatherData = async () => {
            if (!user?.uid) return;

            try {
                // 1. Buscar dados do Firebase imediatamente
                const { weatherData: storedData, currentCity } = await firebaseService.getUserWeatherData(user.uid);

                // 2. Se temos dados no Firebase, mostrar imediatamente
                if (storedData && isMounted) {
                    console.log("[Weather] Dados encontrados no Firebase");
                    setWeatherData(storedData);
                }

                // 3. Verificar se precisamos atualizar (dados antigos ou inexistentes)
                const needsUpdate = !storedData || isDataOlderThan30Minutes(storedData);

                if (needsUpdate && isMounted) {
                    console.log("[Weather] Atualizando dados do clima");
                    setIsUpdating(true);

                    try {
                        // 4. Chamar a API para dados atualizados
                        const response = await fetch(`/api/weather?city=${encodeURIComponent(currentCity)}`);

                        if (!response.ok) {
                            throw new Error(`API error: ${response.status}`);
                        }

                        const freshData = await response.json();

                        // CORREÇÃO: Garantir que o cityName seja consistente com a cidade solicitada
                        const requestedCityName = currentCity.split(',')[0];
                        if (freshData.cityName !== requestedCityName) {
                            console.log(`[Weather] Corrigindo cityName de "${freshData.cityName}" para "${requestedCityName}"`);
                            freshData.cityName = requestedCityName;
                        }

                        // 5. Salvar no Firebase
                        await firebaseService.updateUserWeatherData(user.uid, freshData, currentCity);

                        // 6. Atualizar a UI
                        if (isMounted) {
                            setWeatherData(freshData);
                            setLastRefresh(Date.now());
                        }
                    } catch (error) {
                        console.error("[Weather] Erro ao atualizar dados:", error);
                    } finally {
                        if (isMounted) {
                            setIsUpdating(false);
                        }
                    }
                }
            } catch (error) {
                console.error("[Weather] Erro ao carregar dados:", error);
            }
        };

        loadWeatherData();

        return () => {
            isMounted = false;
        };
    }, [user?.uid]);

    // Função auxiliar para verificar idade dos dados
    const isDataOlderThan30Minutes = (data) => {
        if (!data || !data.timestamp) return true;

        const now = Date.now();
        let dataTime = null;

        try {
            if (typeof data.timestamp === 'object' && data.timestamp.toDate) {
                // Firestore Timestamp
                dataTime = data.timestamp.toDate().getTime();
            } else if (data.timestamp instanceof Date) {
                // Date object
                dataTime = data.timestamp.getTime();
            } else if (typeof data.timestamp === 'string') {
                // ISO string
                dataTime = new Date(data.timestamp).getTime();
            } else if (typeof data.timestamp === 'number') {
                // Unix timestamp
                dataTime = data.timestamp;
            }
        } catch (e) {
            return true;
        }

        if (!dataTime) return true;

        // 30 minutos em millisegundos
        const THIRTY_MINUTES = 30 * 60 * 1000;
        return (now - dataTime) > THIRTY_MINUTES;
    };

    // Função para atualização manual
    const handleRefresh = async () => {
        if (!user?.uid || isUpdating) return;

        // Prevenir multiplos cliques rápidos
        const now = Date.now();
        if (now - lastRefresh < 5000) return; // 5 segundos mínimo entre atualizações

        setIsUpdating(true);
        setLastRefresh(now);

        try {
            // Obter cidade do usuário
            const { currentCity } = await firebaseService.getUserWeatherData(user.uid);

            // Chamar API
            const response = await fetch(`/api/weather?city=${encodeURIComponent(currentCity)}`);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const freshData = await response.json();

            // CORREÇÃO: Garantir que o cityName seja consistente com a cidade solicitada
            const requestedCityName = currentCity.split(',')[0];
            if (freshData.cityName !== requestedCityName) {
                console.log(`[Weather] Corrigindo cityName de "${freshData.cityName}" para "${requestedCityName}"`);
                freshData.cityName = requestedCityName;
            }

            // Salvar no Firebase
            await firebaseService.updateUserWeatherData(user.uid, freshData, currentCity);

            // Atualizar UI
            setWeatherData(freshData);
        } catch (error) {
            console.error("[Weather] Erro na atualização manual:", error);
        } finally {
            setIsUpdating(false);
        }
    };

    // Preparar dados para exibição
    const processWeatherData = (data) => {
        if (!data) return null;

        const processedData = {...data};

        // Garantir que temos todos os campos necessários
        // CORREÇÃO: Priorizar cityRequested sobre cityName
        if (processedData.cityRequested) {
            processedData.cityName = processedData.cityRequested.split(',')[0];
        } else if (!processedData.cityName) {
            processedData.cityName = "São Paulo";
        }

        if (processedData.currentTemp === undefined) processedData.currentTemp = 25;
        if (!processedData.currentWeather) processedData.currentWeather = "Clear";
        if (processedData.highTemp === undefined) processedData.highTemp = processedData.currentTemp + 3;
        if (processedData.lowTemp === undefined) processedData.lowTemp = processedData.currentTemp - 3;

        // Garantir que temos previsão para 2 dias
        if (!processedData.forecast || !Array.isArray(processedData.forecast) || processedData.forecast.length === 0) {
            const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
            const hoje = new Date();
            processedData.forecast = [];

            for (let i = 1; i <= 2; i++) {
                const proximoDia = new Date();
                proximoDia.setDate(hoje.getDate() + i);
                processedData.forecast.push({
                    day: diasSemana[proximoDia.getDay()],
                    weather: "Clouds",
                    lowTemp: Math.round(processedData.lowTemp) - 1 + i,
                    highTemp: Math.round(processedData.highTemp) - 1 + i
                });
            }
        } else if (processedData.forecast.length > 2) {
            // Manter apenas 2 dias
            processedData.forecast = processedData.forecast.slice(0, 2);
        }

        return processedData;
    };

    // Estado de loading inicial - exibir skeleton
    if (!weatherData) {
        return (
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">Carregando clima...</Typography>
                </Box>
                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Box>
        );
    }

    // Processar dados para exibição
    const processedData = processWeatherData(weatherData);

    // Renderizar o componente de clima
    return (
        <Box sx={{ position: 'relative' }}>
            {/* Indicador de atualização em background */}
            {isUpdating && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        m: 1,
                        zIndex: 2,
                        animation: 'pulse 1.5s infinite',
                        '@keyframes pulse': {
                            '0%': { opacity: 0.4 },
                            '50%': { opacity: 0.8 },
                            '100%': { opacity: 0.4 },
                        },
                    }}
                >
                    <RefreshIcon color="primary" fontSize="small" />
                </Box>
            )}

            <WeatherCard
                cityName={processedData.cityName || ""}
                currentTemp={processedData.currentTemp}
                currentWeather={processedData.currentWeather || "N/A"}
                highTemp={processedData.highTemp}
                lowTemp={processedData.lowTemp}
                forecast={processedData.forecast || []}
                onRefresh={handleRefresh}
            />
        </Box>
    );
};

export default WeatherContainer;