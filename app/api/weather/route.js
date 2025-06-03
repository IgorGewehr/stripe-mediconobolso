// app/api/weather/route.js
import { NextResponse } from 'next/server';

// In-memory cache to track API requests regardless of user
// This is critical for limiting API usage at the server level
const API_CACHE = {
    requests: {}, // Map of city → timestamp
    results: {},  // Map of city → result data
};

// Constants
const RATE_LIMIT_PERIOD = 30 * 60 * 1000; // 30 minutes in milliseconds
const CACHE_EXPIRY = 60 * 60 * 1000;      // 1 hour cache validity

export const revalidate = false; // Disable automatic revalidation

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    let city = searchParams.get('city') || "São Paulo,BR";
    const apiKey = process.env.WEATHER_APIKEY || "9a41fa2624c783ab51c5639d8236996d";

    // Format city correctly by adding country code if not present
    if (!city.includes(',')) {
        city = `${city},BR`;
    }

    // Get the current time
    const now = Date.now();

    // CRITICAL SERVER-SIDE RATE LIMITING
    // Check if we have a recent request for this city
    if (API_CACHE.requests[city] && now - API_CACHE.requests[city] < RATE_LIMIT_PERIOD) {
        console.log(`[Weather API] RATE LIMITED request for ${city} - using cached data`);

        // Return cached data if available
        if (API_CACHE.results[city]) {
            return NextResponse.json({
                ...API_CACHE.results[city],
                fromCache: true,
                cacheTime: new Date(API_CACHE.requests[city]).toISOString()
            });
        }
    }

    console.log(`[Weather API] Consultando clima para: ${city}`);

    try {
        // Update the request time for this city
        API_CACHE.requests[city] = now;

        // 1. Get current weather data using Weather API (free version)
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=pt_br`;
        console.log(`[Weather API] Fazendo requisição para Weather API: ${weatherUrl}`);

        const weatherResponse = await fetch(weatherUrl);
        if (!weatherResponse.ok) {
            const errorText = await weatherResponse.text();
            console.error(`[Weather API] Erro na Weather API (${weatherResponse.status}):`, errorText);

            // Even on error, don't make another request for this city for the rate limit period
            throw new Error(`Erro ${weatherResponse.status}: Cidade não encontrada ou API indisponível`);
        }

        const weatherData = await weatherResponse.json();
        console.log(`[Weather API] Dados atuais obtidos para: ${weatherData.name}`);

        // 2. Get forecast for coming days using Forecast API (free version)
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=pt_br`;
        console.log(`[Weather API] Fazendo requisição para Forecast API`);

        const forecastResponse = await fetch(forecastUrl);
        if (!forecastResponse.ok) {
            const errorText = await forecastResponse.text();
            console.error(`[Weather API] Erro na Forecast API (${forecastResponse.status}):`, errorText);
            throw new Error(`Erro ${forecastResponse.status}: Falha ao obter previsão do tempo`);
        }

        const forecastData = await forecastResponse.json();

        // Process forecast data for coming days
        // The API returns predictions for every 3 hours, we need to group by day
        const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const hoje = new Date();
        const amanha = new Date(hoje);
        amanha.setDate(hoje.getDate() + 1);
        const depoisDeAmanha = new Date(hoje);
        depoisDeAmanha.setDate(hoje.getDate() + 2);

        // Format dates for comparison
        const formatDate = (date) => {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        };

        const amanhaStr = formatDate(amanha);
        const depoisDeAmanhaStr = formatDate(depoisDeAmanha);

        // Group forecasts by day
        const previsoesPorDia = {};

        forecastData.list.forEach(forecast => {
            const data = new Date(forecast.dt * 1000);
            const dataStr = formatDate(data);

            // We're only interested in tomorrow and day after tomorrow
            if (dataStr === amanhaStr || dataStr === depoisDeAmanhaStr) {
                if (!previsoesPorDia[dataStr]) {
                    previsoesPorDia[dataStr] = {
                        temps: [],
                        weathers: [],
                        day: diasSemana[data.getDay()]
                    };
                }

                previsoesPorDia[dataStr].temps.push(forecast.main.temp);
                previsoesPorDia[dataStr].weathers.push(forecast.weather[0].main);
            }
        });

        // Format the next 2 days
        const nextDays = [amanhaStr, depoisDeAmanhaStr]
            .filter(day => previsoesPorDia[day]) // Ensure we only use days with data
            .map(day => {
                const dayData = previsoesPorDia[day];
                const temps = dayData.temps;

                // Find most common weather condition for the day
                const weatherCount = {};
                dayData.weathers.forEach(weather => {
                    weatherCount[weather] = (weatherCount[weather] || 0) + 1;
                });
                const mainWeather = Object.keys(weatherCount).reduce((a, b) =>
                    weatherCount[a] > weatherCount[b] ? a : b, dayData.weathers[0]);

                return {
                    day: dayData.day,
                    weather: mainWeather,
                    lowTemp: Math.round(Math.min(...temps)),
                    highTemp: Math.round(Math.max(...temps))
                };
            });

        if (nextDays.length < 2) {
            console.warn("[Weather API] Dados de previsão insuficientes, adicionando dados simulados");
            // Fill in missing days with simulated data
            while (nextDays.length < 2) {
                const proximoDia = new Date(hoje);
                proximoDia.setDate(hoje.getDate() + nextDays.length + 1);

                nextDays.push({
                    day: diasSemana[proximoDia.getDay()],
                    weather: "Clouds",
                    lowTemp: Math.round(weatherData.main.temp) - 2,
                    highTemp: Math.round(weatherData.main.temp) + 2
                });
            }
        }

        // Format final object
        const result = {
            cityName: city.split(',')[0],
            originalCityName: weatherData.name,
            currentTemp: Math.round(weatherData.main.temp),
            currentWeather: weatherData.weather[0].main,
            highTemp: Math.round(weatherData.main.temp_max),
            lowTemp: Math.round(weatherData.main.temp_min),
            forecast: nextDays,
            requestTime: new Date().toISOString(),
            fromCache: false
        };

        console.log("[Weather API] Dados processados com sucesso:",
            result.cityName,
            `${result.currentTemp}°C`,
            `Previsão: ${nextDays.length} dias`
        );

        // Cache the result
        API_CACHE.results[city] = result;

        return NextResponse.json(result);
    } catch (error) {
        console.error("[Weather API] Erro ao buscar dados do clima:", error.message);

        // Check if we have cached data for this city
        if (API_CACHE.results[city]) {
            console.log(`[Weather API] Retornando dados em cache para ${city} após erro`);
            return NextResponse.json({
                ...API_CACHE.results[city],
                fromCache: true,
                cacheTime: new Date(API_CACHE.requests[city]).toISOString(),
                errorMessage: error.message
            });
        }

        // Generate simulated data in case of error and no cache
        const result = generateSimulatedWeatherData(city);

        // Add error info to the result
        result.isSimulated = true;
        result.error = error.message;

        // Cache the simulated result too
        API_CACHE.results[city] = result;

        return NextResponse.json(result);
    }
}

// Function to generate simulated weather data when the API fails
function generateSimulatedWeatherData(city) {
    const cityName = city.split(',')[0];
    const hoje = new Date();
    const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    // Random base temperature between 18 and 28
    const baseTemp = Math.floor(Math.random() * 10) + 18;

    // Possible weather conditions
    const possibleWeather = ["Clear", "Clouds", "Rain"];
    const currentWeather = possibleWeather[Math.floor(Math.random() * possibleWeather.length)];

    // Forecast for the next 2 days
    const forecast = [];
    for (let i = 1; i <= 2; i++) {
        const nextDay = new Date(hoje);
        nextDay.setDate(hoje.getDate() + i);

        forecast.push({
            day: diasSemana[nextDay.getDay()],
            weather: possibleWeather[Math.floor(Math.random() * possibleWeather.length)],
            lowTemp: baseTemp - Math.floor(Math.random() * 5),
            highTemp: baseTemp + Math.floor(Math.random() * 5)
        });
    }

    const result = {
        cityName: cityName,
        currentTemp: baseTemp,
        currentWeather: currentWeather,
        highTemp: baseTemp + 3,
        lowTemp: baseTemp - 3,
        forecast: forecast,
        isSimulated: true
    };

    console.log("[Weather API] Usando dados simulados para:", cityName);

    return result;
}

// Cleanup old cache entries periodically
setInterval(() => {
    const now = Date.now();
    Object.keys(API_CACHE.requests).forEach(city => {
        if (now - API_CACHE.requests[city] > CACHE_EXPIRY) {
            delete API_CACHE.requests[city];
            delete API_CACHE.results[city];
        }
    });
}, 60 * 60 * 1000); // Run once per hour