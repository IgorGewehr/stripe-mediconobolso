import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CloudIcon from '@mui/icons-material/Cloud';

const WeatherCard = ({
                         cityName = 'Florianópolis',
                         currentTemp = 32,
                         currentWeather = 'Sol',
                         highTemp = 72,
                         lowTemp = 55,
                         forecast = [
                             { day: 'Ter', weather: 'Sol', lowTemp: 25, highTemp: 33 },
                             { day: 'Qua', weather: 'Sol', lowTemp: 26, highTemp: 32 }
                         ]
                     }) => {
    const getWeatherIcon = (weather) => {
        if (weather.toLowerCase().includes('sol') || weather.toLowerCase().includes('sun')) {
            return <WbSunnyIcon sx={{ fontSize: 18 }} />;
        }
        return <CloudIcon sx={{ fontSize: 18 }} />;
    };

    return (
        <Paper
            elevation={0}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '16px 14px',
                borderRadius: '20px',
                height: '180px',
                width: '100%',
                border: '1px solid',
                borderColor: '#e0e0e0',
                backgroundColor: 'white',
                boxSizing: 'border-box'
            }}
        >
            {/* Seção do clima atual */}
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', width: '100%' }}>
                <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#172554', lineHeight: 1, fontSize: '0.9rem' }}>
                        {cityName}
                    </Typography>
                    <LocationOnIcon sx={{ width: 10, height: 10, color: '#172554' }} />
                </Box>

                <Box sx={{ display: 'flex', gap: '2px', alignItems: 'flex-start' }}>
                    <Typography variant="h3" sx={{ fontWeight: 600, color: '#2563EB', lineHeight: 1, fontSize: '2.5rem' }}>
                        {currentTemp}°
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#172554', fontSize: '0.85rem' }}>
                                {currentWeather}
                            </Typography>
                            {getWeatherIcon(currentWeather)}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#172554', fontSize: '0.85rem', mt: 0.5 }}>
                            H:{highTemp}° L:{lowTemp}°
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Linha divisória */}
            <Box
                sx={{
                    height: '1px',
                    width: '100%',
                    backgroundColor: '#e0e0e0',
                    my: 1
                }}
            />

            {/* Seção de previsão */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                {forecast.map((day, index) => (
                    <Box key={index} sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '45%'
                    }}>
                        <Typography variant="body2" sx={{
                            fontWeight: 600,
                            color: '#172554',
                            fontSize: '0.9rem',
                            lineHeight: 1,
                            mb: 0.5
                        }}>
                            {day.day}
                        </Typography>

                        {getWeatherIcon(day.weather)}

                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '4px',
                            mt: 0.5
                        }}>
                            <Typography variant="body2" sx={{
                                fontWeight: 500,
                                color: '#172554',
                                fontSize: '0.85rem',
                                lineHeight: 1
                            }}>
                                {day.lowTemp}°
                            </Typography>
                            <Typography variant="body2" sx={{
                                fontWeight: 600,
                                color: '#172554',
                                fontSize: '0.85rem',
                                lineHeight: 1
                            }}>
                                {day.highTemp}°
                            </Typography>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
};

export default WeatherCard;