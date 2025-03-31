import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    let city = searchParams.get('city') || "São Paulo,BR";
    const apiKey = process.env.WEATHER_APIKEY || "9a41fa2624c783ab51c5639d8236996d";

    // Formatar corretamente a cidade adicionando o código do país se não estiver presente
    if (!city.includes(',')) {
        // Adiciona o código do Brasil como padrão se nenhum país for especificado
        city = `${city},BR`;
    }

    console.log(`Consultando clima para: ${city}`);

    try {
        // 1. Obter dados atuais do clima usando a API Weather (versão gratuita)
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=pt_br`;
        console.log(`Fazendo requisição para Weather API: ${weatherUrl}`);

        const weatherResponse = await fetch(weatherUrl);
        if (!weatherResponse.ok) {
            const errorText = await weatherResponse.text();
            console.error(`Erro na Weather API (${weatherResponse.status}):`, errorText);
            throw new Error(`Erro ${weatherResponse.status}: ${errorText}`);
        }

        const weatherData = await weatherResponse.json();
        console.log(`Dados atuais obtidos para: ${weatherData.name}`);

        // 2. Obter previsão para os próximos dias usando a API Forecast (versão gratuita)
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=pt_br`;
        console.log(`Fazendo requisição para Forecast API`);

        const forecastResponse = await fetch(forecastUrl);
        if (!forecastResponse.ok) {
            const errorText = await forecastResponse.text();
            console.error(`Erro na Forecast API (${forecastResponse.status}):`, errorText);
            throw new Error(`Erro ${forecastResponse.status}: ${errorText}`);
        }

        const forecastData = await forecastResponse.json();

        // Processar dados de previsão para os próximos dias
        // A API retorna previsões para cada 3 horas, precisamos agrupar por dia
        const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const hoje = new Date();
        const amanha = new Date(hoje);
        amanha.setDate(hoje.getDate() + 1);
        const depoisDeAmanha = new Date(hoje);
        depoisDeAmanha.setDate(hoje.getDate() + 2);

        // Formatando as datas para comparação
        const formatDate = (date) => {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        };

        const amanhaStr = formatDate(amanha);
        const depoisDeAmanhaStr = formatDate(depoisDeAmanha);

        // Agrupar previsões por dia
        const previsoesPorDia = {};

        forecastData.list.forEach(forecast => {
            const data = new Date(forecast.dt * 1000);
            const dataStr = formatDate(data);

            // Só nos interessam amanhã e depois de amanhã
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

        // Formatar os próximos 2 dias
        const nextDays = [amanhaStr, depoisDeAmanhaStr]
            .filter(day => previsoesPorDia[day]) // Garante que só usamos dias com dados
            .map(day => {
                const dayData = previsoesPorDia[day];
                const temps = dayData.temps;

                // Encontrar a condição climática mais comum do dia
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
            console.warn("Dados de previsão insuficientes, adicionando dados simulados");
            // Preencher dias faltantes com dados simulados
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

        // Formatar o objeto final
        const result = {
            cityName: weatherData.name,
            currentTemp: Math.round(weatherData.main.temp),
            currentWeather: weatherData.weather[0].main,
            highTemp: Math.round(weatherData.main.temp_max),
            lowTemp: Math.round(weatherData.main.temp_min),
            forecast: nextDays
        };

        console.log("Dados processados com sucesso:",
            result.cityName,
            `${result.currentTemp}°C`,
            `Previsão: ${nextDays.length} dias`
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error("Erro ao buscar dados do clima:", error.message);

        // Gerar dados simulados em caso de erro
        const result = generateSimulatedWeatherData(city);

        return NextResponse.json(result);
    }
}

// Função para gerar dados simulados quando a API falha
function generateSimulatedWeatherData(city) {
    const cityName = city.split(',')[0];
    const hoje = new Date();
    const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    // Temperatura base aleatória entre 18 e 28
    const baseTemp = Math.floor(Math.random() * 10) + 18;

    // Condições climáticas possíveis
    const possibleWeather = ["Clear", "Clouds", "Rain"];
    const currentWeather = possibleWeather[Math.floor(Math.random() * possibleWeather.length)];

    // Previsão para os próximos 2 dias
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
        forecast: forecast
    };

    console.log("Usando dados simulados para:", cityName);

    return result;
}