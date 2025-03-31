import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || "São Paulo,BR";
    const apiKey = process.env.WEATTHER_APIKEY;
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        const response = await fetch(weatherUrl);
        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                { error: errorData.message || 'Erro ao buscar dados do clima' },
                { status: response.status }
            );
        }
        const data = await response.json();

        // Obter a previsão usando a One Call API
        const { lat, lon } = data.coord;
        const forecastUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`;
        const forecastResponse = await fetch(forecastUrl);
        const forecastData = await forecastResponse.json();

        // Extrai os próximos 2 dias (ignorando o dia atual), se disponível
        const forecast = forecastData.daily
            ? forecastData.daily.slice(1, 3).map(day => ({
                day: new Date(day.dt * 1000).toLocaleDateString('pt-BR', { weekday: 'short' }),
                weather: day.weather[0].main,
                lowTemp: Math.round(day.temp.min),
                highTemp: Math.round(day.temp.max)
            }))
            : [];

        return NextResponse.json({
            ...data,
            forecast
        });
    } catch (error) {
        console.error("Erro ao buscar dados do clima:", error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}
