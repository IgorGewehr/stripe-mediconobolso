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
            return <WbSunnyIcon sx={{ fontSize: 20 }} />;
        }
        return <CloudIcon sx={{ fontSize: 20 }} />;
    };

    return (
        <Paper
            elevation={2}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '24px 16px',
                borderRadius: '24px',
                maxWidth: '169px',
                overflow: 'hidden',
                backgroundColor: 'white'
            }}
        >
            {/* Seção do clima atual */}
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', width: '100%', minHeight: '70px' }}>
                <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#172554', lineHeight: 1 }}>
                        {cityName}
                    </Typography>
                    <LocationOnIcon sx={{ width: 10, height: 10, color: '#172554' }} />
                </Box>

                <Box sx={{ display: 'flex', gap: '2px', alignItems: 'flex-start', mt: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 500, color: '#2563EB', lineHeight: 1 }}>
                        {currentTemp}°
                    </Typography>

                    <Box sx={{ display: 'flex', gap: '2px', alignItems: 'center', fontSize: '0.875rem', fontWeight: 500, color: '#172554' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#172554', fontSize: '0.875rem' }}>
                            {currentWeather}
                        </Typography>
                        {getWeatherIcon(currentWeather)}
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#172554', fontSize: '0.875rem' }}>
                            H:{highTemp}° L:{lowTemp}°
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Seção de previsão */}
            <Box sx={{ display: 'flex', gap: '32px', mt: 2.5, width: '100%' }}>
                <Box sx={{ display: 'flex', flex: 1, gap: '6px', alignItems: 'flex-start' }}>
                    <Box sx={{ pt: 0.5, fontSize: '0.875rem', fontWeight: 500, color: '#172554', width: '26px' }}>
                        {forecast.map((day, index) => (
                            <Typography key={index} variant="body2" sx={{
                                mt: index > 0 ? 2 : 0,
                                fontWeight: 500,
                                color: '#172554',
                                fontSize: '0.875rem',
                                lineHeight: 1,
                                whiteSpace: 'nowrap'
                            }}>
                                {day.day}
                            </Typography>
                        ))}
                    </Box>

                    <Box sx={{ width: '27px' }}>
                        {forecast.map((day, index) => (
                            <Box key={index} sx={{ mt: index > 0 ? 0.75 : 0 }}>
                                {getWeatherIcon(day.weather)}
                            </Box>
                        ))}
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', flex: 1, gap: '2px', alignItems: 'flex-start', fontSize: '0.875rem', fontWeight: 500, color: '#172554' }}>
                    <Box sx={{ pt: 0.5, width: '17px' }}>
                        {forecast.map((day, index) => (
                            <Typography key={index} variant="body2" sx={{
                                mt: index > 0 ? 2 : 0,
                                fontWeight: 500,
                                color: '#172554',
                                fontSize: '0.875rem',
                                lineHeight: 1
                            }}>
                                {day.lowTemp}
                            </Typography>
                        ))}
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', pt: 0.5, textAlign: 'center', width: '26px' }}>
                        {forecast.map((day, index) => (
                            <Typography key={index} variant="body2" sx={{
                                mt: index > 0 ? 2 : 0,
                                fontWeight: 500,
                                color: '#172554',
                                fontSize: '0.875rem',
                                lineHeight: 1
                            }}>
                                {day.highTemp}°
                            </Typography>
                        ))}
                    </Box>
                </Box>
            </Box>
        </Paper>
    );
};

export default WeatherCard;