"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Skeleton, Box } from "@mui/material";
import { useAuth } from "../authProvider";
import WeatherCard from "../basicComponents/weatherCard";
import firebaseService from "../../../lib/firebaseService"; // Ajuste o caminho conforme necessário

const WeatherContainer = () => {
    const { user } = useAuth();
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Usar refs para controlar o estado de atualização e última requisição
    const isUpdatingRef = useRef(false);
    const lastRequestTimeRef = useRef({});  // Objeto para armazenar timestamp por usuário

    // Função para buscar dados da API de clima
    const fetchWeatherFromAPI = useCallback(async (city) => {
        // Verificar se outra requisição está em andamento
        if (isUpdatingRef.current) {
            console.log("Já existe uma requisição em andamento. Ignorando.");
            return null;
        }

        // Verificar tempo desde a última requisição (no mínimo 30 minutos)
        const now = Date.now();
        const userId = user?.uid || 'guest';
        const lastTime = lastRequestTimeRef.current[userId] || 0;
        const THIRTY_MINUTES = 30 * 60 * 1000; // 30 minutos em milissegundos

        if (now - lastTime < THIRTY_MINUTES) {
            console.log(`Requisição para ${userId} muito recente (menos de 30 minutos). Ignorando.`);
            return null;
        }

        try {
            isUpdatingRef.current = true;
            // Armazenar tempo da última requisição por usuário
            lastRequestTimeRef.current[userId] = now;
            console.log(`Buscando clima para cidade: ${city}`);

            const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // Salvar os dados no Firestore
            if (user?.uid) {
                await firebaseService.updateUserWeatherData(user.uid, data, city);
            }

            setWeatherData(data);
            return data;
        } catch (err) {
            console.error("Erro ao buscar dados do clima:", err);
            setError(err.message);
            return null;
        } finally {
            isUpdatingRef.current = false;
        }
    }, [user?.uid]);

    // Carregar dados do clima
    const loadWeatherData = useCallback(async (forceRefresh = false) => {
        // Verificações para evitar requisições desnecessárias
        if (!user?.uid || isUpdatingRef.current) {
            return;
        }

        // Se não forçar atualização e já tivermos dados, evitar recarregar frequentemente
        const userId = user?.uid || 'guest';
        const lastTime = lastRequestTimeRef.current[userId] || 0;
        const THIRTY_MINUTES = 30 * 60 * 1000; // 30 minutos em milissegundos

        if (!forceRefresh && weatherData && Date.now() - lastTime < THIRTY_MINUTES) {
            return;
        }

        try {
            setLoading(true);

            // Buscar dados do usuário
            const { weatherData: storedWeatherData, currentCity } =
                await firebaseService.getUserWeatherData(user.uid);

            // Verificar se precisamos atualizar os dados
            const shouldUpdate = forceRefresh ||
                await firebaseService.shouldUpdateWeatherData(storedWeatherData, currentCity);

            if (shouldUpdate) {
                console.log("Buscando novos dados do clima...");
                const newData = await fetchWeatherFromAPI(currentCity);
                if (newData) {
                    setWeatherData(newData);
                } else if (storedWeatherData) {
                    // Se a nova requisição falhou mas temos dados em cache, use-os
                    setWeatherData(storedWeatherData);
                }
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
    }, [user?.uid, fetchWeatherFromAPI]);

    // useEffect para carregar dados iniciais
    useEffect(() => {
        // Carregar dados apenas uma vez na montagem do componente
        // ou quando o usuário mudar
        if (user?.uid) {
            loadWeatherData(true);
        }

        // Configurar intervalo apenas na montagem
        const intervalId = setInterval(() => {
            if (user?.uid && !isUpdatingRef.current) {
                loadWeatherData();
            }
        }, 30 * 60 * 1000); // Verificar a cada 30 minutos

        return () => {
            clearInterval(intervalId);
        };
    }, [user?.uid, loadWeatherData]);

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
    if (loading && !weatherData) {
        return (
            <Box sx={{ p: 2 }}>
                <Skeleton variant="text" width={120} height={24} />
                <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2, my: 1 }} />
                <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2, my: 1 }} />
            </Box>
        );
    }

    if (error && !weatherData) {
        return <Box sx={{ p: 2 }}>Não foi possível carregar o clima.</Box>;
    }

    // Mostrar dados mesmo durante recarregamento
    if (!weatherData) {
        return <Box sx={{ p: 2 }}>Carregando dados do clima...</Box>;
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