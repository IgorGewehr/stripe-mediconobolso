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

    // Se o usuário estiver logado e possuir uma cidade cadastrada, usamos essa cidade
    const userCity = user && user.address && user.address.city ? user.address.city : "São Paulo,BR";
    // Incluímos o uid do usuário na chave de cache para torná-la única por usuário.
    const STORAGE_KEY = user && user.uid
        ? `weather-${user.uid}-${userCity}`
        : `weather-guest-${userCity}`;

    const fetchWeather = async () => {
        try {
            const res = await fetch(`/api/weather?city=${encodeURIComponent(userCity)}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            // Salva os dados com o timestamp no localStorage utilizando a chave única
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
        // Tenta carregar os dados do cache
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
            try {
                const { timestamp, data } = JSON.parse(cached);
                const threeHours = 3 * 60 * 60 * 1000;
                // Se o cache estiver dentro do tempo válido, usamos os dados
                if (Date.now() - timestamp < threeHours) {
                    console.log("Usando dados em cache:", data);
                    setWeatherData(data);
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error("Erro ao processar cache:", err);
            }
        }
        // Caso contrário, busca novos dados
        fetchWeather();
    }, [userCity, STORAGE_KEY]);

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

    // Ajuste da previsão caso os dados não venham completos
    if (!weatherData.forecast || !Array.isArray(weatherData.forecast) || weatherData.forecast.length === 0) {
        console.warn("Dados de previsão ausentes ou inválidos:", weatherData);
        const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const hoje = new Date();
        weatherData.forecast = [];
        for (let i = 1; i <= 2; i++) {
            const proximoDia = new Date();
            proximoDia.setDate(hoje.getDate() + i);
            weatherData.forecast.push({
                day: diasSemana[proximoDia.getDay()],
                weather: "Clouds",
                lowTemp: Math.round(weatherData.lowTemp || 20) - 2 + i,
                highTemp: Math.round(weatherData.highTemp || 30) - 2 + i
            });
        }
    } else {
        // Se a previsão estiver retornando dados de hoje, removemos para mostrar apenas os próximos dias
        const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const hoje = new Date();
        const diaAtual = diasSemana[hoje.getDay()];
        if (weatherData.forecast.length > 2 && weatherData.forecast[0].day === diaAtual) {
            weatherData.forecast = weatherData.forecast.slice(1);
        }
        weatherData.forecast = weatherData.forecast.slice(0, 2);
    }

    const weatherProps = {
        cityName: weatherData.cityName || userCity,
        currentTemp: weatherData.currentTemp,
        currentWeather: weatherData.currentWeather || "N/A",
        highTemp: weatherData.highTemp,
        lowTemp: weatherData.lowTemp,
        forecast: weatherData.forecast || [],
    };

    return <WeatherCard {...weatherProps} />;
};

export default WeatherContainer;
