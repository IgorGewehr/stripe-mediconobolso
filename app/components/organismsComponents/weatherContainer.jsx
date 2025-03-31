"use client";

import React, { useEffect, useState } from "react";
import { Skeleton, Box } from "@mui/material";
import { useAuth } from "../authProvider";
import WeatherCard from "../basicComponents/weatherCard";

const WeatherContainer = () => {
    const { user } = useAuth();
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const userCity =
        user && user.address && user.address.city ? user.address.city : "São Paulo,BR";
    const STORAGE_KEY = `weather-${userCity}`;

    const fetchWeather = async () => {
        try {
            const res = await fetch(`/api/weather?city=${encodeURIComponent(userCity)}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Log para diagnóstico
            console.log("Dados recebidos da API:", data);

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ timestamp: Date.now(), data })
            );
            setWeatherData(data);
        } catch (err) {
            console.error("Erro ao buscar dados:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
            try {
                const { timestamp, data } = JSON.parse(cached);
                const threeHours = 3 * 60 * 60 * 1000;
                if (Date.now() - timestamp < threeHours) {
                    console.log("Usando dados em cache:", data);
                    setWeatherData(data);
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error("Erro ao processar cache:", err);
                // Se houver erro no cache, busca novos dados
            }
        }
        fetchWeather();
    }, [userCity]);

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

    // Verificando se temos dados de previsão
    if (!weatherData.forecast || !Array.isArray(weatherData.forecast) || weatherData.forecast.length === 0) {
        console.warn("Dados de previsão ausentes ou inválidos:", weatherData);

        // Adiciona dados de previsão para os próximos dias
        // Começando a partir de amanhã
        const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const hoje = new Date();

        weatherData.forecast = [];

        // Próximos 2 dias (amanhã e depois de amanhã)
        for (let i = 1; i <= 2; i++) {
            const proximoDia = new Date();
            proximoDia.setDate(hoje.getDate() + i);

            weatherData.forecast.push({
                day: diasSemana[proximoDia.getDay()],
                weather: "Clouds", // padrão
                lowTemp: Math.round(weatherData.lowTemp || 20) - 2 + i,
                highTemp: Math.round(weatherData.highTemp || 30) - 2 + i
            });
        }
    } else {
        // Se já temos forecast na API, garantir que são os próximos 2 dias (não hoje)
        // Se o primeiro dia for "hoje", removemos e pegamos só os 2 seguintes
        const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const hoje = new Date();
        const diaAtual = diasSemana[hoje.getDay()];

        // Se o primeiro dia da previsão for hoje, removemos ele
        if (weatherData.forecast.length > 2 && weatherData.forecast[0].day === diaAtual) {
            weatherData.forecast = weatherData.forecast.slice(1);
        }

        // Limita a 2 dias
        weatherData.forecast = weatherData.forecast.slice(0, 2);
    }

    // Garante que temos dados atuais e temperaturas max/min para hoje
    if (!weatherData.currentTemp) {
        console.warn("Dados de temperatura atual ausentes, usando valores padrão");
        weatherData.currentTemp = weatherData.currentTemp || 25;
        weatherData.currentWeather = weatherData.currentWeather || "Clear";
    }

    // Garante que temos dados de max/min para hoje
    if (weatherData.highTemp === undefined || weatherData.lowTemp === undefined) {
        console.warn("Temperaturas máxima/mínima ausentes, usando valores derivados");
        weatherData.highTemp = Math.round(weatherData.currentTemp * 1.1); // 10% acima da atual
        weatherData.lowTemp = Math.round(weatherData.currentTemp * 0.9);  // 10% abaixo da atual
    }

    // Log para diagnóstico da previsão
    console.log("Dados de previsão processados:", weatherData.forecast);

    // Preparando os dados para o WeatherCard
    const weatherProps = {
        cityName: weatherData.cityName || userCity,
        currentTemp: weatherData.currentTemp,
        currentWeather: weatherData.currentWeather || "N/A",
        highTemp: weatherData.highTemp,
        lowTemp: weatherData.lowTemp,
        forecast: weatherData.forecast || [],
    };

    // Log final dos dados passados para o WeatherCard
    console.log("Dados enviados para WeatherCard:", weatherProps);

    return <WeatherCard {...weatherProps} />;
};

export default WeatherContainer;