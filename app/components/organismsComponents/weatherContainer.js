import { useEffect, useState } from 'react';
import { useAuth } from '../authProvider';
import WeatherCard from "../basicComponents/weatherCard";

const WeatherContainer = () => {
    const { user } = useAuth();
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const userCity = user && user.address && user.address.city
        ? user.address.city
        : "São Paulo,BR";

    const fetchWeather = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/weather?city=${encodeURIComponent(userCity)}`);
            const data = await res.json();
            if (data.error) {
                throw new Error(data.error);
            }
            setWeatherData(data);
        } catch (err) {
            console.error("Erro ao buscar dados do clima:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeather();
        const intervalId = setInterval(fetchWeather, 3600000);
        return () => clearInterval(intervalId);
    }, [userCity]);

    if (loading) return <div>Carregando informações do clima...</div>;
    if (error) return <div>Erro: {error}</div>;
    if (!weatherData || !weatherData.main) {
        return <div>Dados do clima indisponíveis</div>;
    }

    const weatherProps = {
        cityName: weatherData.name || userCity,
        currentTemp: Math.round(weatherData.main.temp),
        currentWeather: weatherData.weather && weatherData.weather[0]
            ? weatherData.weather[0].description
            : "N/A",
        highTemp: Math.round(weatherData.main.temp_max),
        lowTemp: Math.round(weatherData.main.temp_min),
        forecast: weatherData.forecast || []
    };

    return <WeatherCard {...weatherProps} />;
};

export default WeatherContainer;
