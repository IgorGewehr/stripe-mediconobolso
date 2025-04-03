"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Skeleton, Box } from "@mui/material";
import { useAuth } from "../authProvider";
import WeatherCard from "../basicComponents/weatherCard";
import firebaseService from "../../../lib/firebaseService"; // Ajuste o caminho conforme necessário

const WeatherContainer = () => {
    const { user } = useAuth();
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Função para buscar dados da API de clima - envolva em useCallback
    const fetchWeatherFromAPI = useCallback(async (city) => {
        try {
            setIsUpdating(true);
            console.log(`Buscando clima para cidade: ${city}`);

            const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Salvar os dados no Firestore
            await firebaseService.updateUserWeatherData(user.uid, data, city);

            setWeatherData(data);
            return data;
        } catch (err) {
            console.error("Erro ao buscar dados do clima:", err);
            setError(err.message);
            throw err;
        } finally {
            setIsUpdating(false);
        }
    }, [user?.uid]); // Dependência estável

    // Carregar dados do clima - envolva em useCallback
    const loadWeatherData = useCallback(async () => {
        if (isUpdating || !user?.uid) return; // Evitar múltiplas chamadas ou quando não há usuário

        try {
            setLoading(true);

            // Buscar dados do usuário para ter a cidade mais atual e os dados do clima
            const { weatherData: storedWeatherData, currentCity } = await firebaseService.getUserWeatherData(user.uid);

            // Verificar se precisamos atualizar os dados
            const shouldUpdate = await firebaseService.shouldUpdateWeatherData(storedWeatherData, currentCity);

            if (shouldUpdate) {
                console.log("Dados do clima desatualizados ou cidade diferente, buscando novos dados...");
                console.log(`Cidade atual do usuário: ${currentCity}`);
                await fetchWeatherFromAPI(currentCity);
            } else {
                console.log("Usando dados do clima do Firestore");
                setWeatherData(storedWeatherData);
            }
        } catch (err) {
            console.error("Erro ao carregar dados do clima:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user?.uid, fetchWeatherFromAPI, isUpdating]); // Dependências estáveis

    // useEffect com dependências estáveis
    useEffect(() => {
        // Carregar dados quando o componente for montado
        loadWeatherData();

        // Opcional: adicionar um intervalo para verificar mudanças a cada minuto
        const interval = setInterval(() => {
            loadWeatherData();
        }, 60000); // 1 minuto

        return () => clearInterval(interval);
    }, [loadWeatherData]); // Única dependência estável

    // Processamento de previsão
    const processWeatherData = (data) => {
        if (!data) return null;

        const processedData = {...data};

        // Ajuste da previsão caso os dados não venham completos
        if (!processedData.forecast || !Array.isArray(processedData.forecast) || processedData.forecast.length === 0) {
            console.warn("Dados de previsão ausentes ou inválidos");
            const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
            const hoje = new Date();
            processedData.forecast = [];
            for (let i = 1; i <= 2; i++) {
                const proximoDia = new Date();
                proximoDia.setDate(hoje.getDate() + i);
                processedData.forecast.push({
                    day: diasSemana[proximoDia.getDay()],
                    weather: "Clouds",
                    lowTemp: Math.round(processedData.lowTemp || 20) - 2 + i,
                    highTemp: Math.round(processedData.highTemp || 30) - 2 + i
                });
            }
        } else {
            // Se a previsão estiver retornando dados de hoje, removemos para mostrar apenas os próximos dias
            const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
            const hoje = new Date();
            const diaAtual = diasSemana[hoje.getDay()];
            if (processedData.forecast.length > 2 && processedData.forecast[0].day === diaAtual) {
                processedData.forecast = processedData.forecast.slice(1);
            }
            processedData.forecast = processedData.forecast.slice(0, 2);
        }

        return processedData;
    };

    // Renderização com base no estado
    if (loading) {
        return (
            <Box sx={{ p: 2 }}>
                <Skeleton variant="text" width={120} height={24} />
                <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2, my: 1 }} />
                <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2, my: 1 }} />
            </Box>
        );
    }

    if (error || !weatherData) {
        return <Box sx={{ p: 2 }}>Não foi possível carregar o clima.</Box>;
    }

    // Processar os dados antes de passar para o componente
    const processedWeatherData = processWeatherData(weatherData);

    // Preparar props para o WeatherCard
    const weatherProps = {
        cityName: processedWeatherData.cityName || "",
        currentTemp: processedWeatherData.currentTemp,
        currentWeather: processedWeatherData.currentWeather || "N/A",
        highTemp: processedWeatherData.highTemp,
        lowTemp: processedWeatherData.lowTemp,
        forecast: processedWeatherData.forecast || [],
    };

    return <WeatherCard {...weatherProps} />;
};

export default WeatherContainer;