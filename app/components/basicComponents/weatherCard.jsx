"use client";

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import GrainIcon from '@mui/icons-material/Grain';
import CloudIcon from '@mui/icons-material/Cloud';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const weatherIcons = {
    Clear: <WbSunnyIcon sx={{ fontSize: 18, color: '#f59e0b' }} />,
    Rain: <GrainIcon sx={{ fontSize: 18, color: '#3b82f6' }} />,
    Snow: <AcUnitIcon sx={{ fontSize: 18, color: '#64748b' }} />,
    Clouds: <CloudIcon sx={{ fontSize: 18, color: '#6b7280' }} />
};

const getWeatherLabel = (weather) => {
    switch(weather) {
        case 'Clear': return 'Ensolarado';
        case 'Clouds': return 'Nublado';
        case 'Rain': return 'Chuvoso';
        case 'Snow': return 'Nevando';
        default: return weather;
    }
};

const WeatherCard = ({
                         cityName,
                         currentTemp,
                         currentWeather,
                         highTemp,
                         lowTemp,
                         forecast = []
                     }) => {
    // Log para diagnóstico - para ver o que está chegando no componente
    console.log("WeatherCard recebeu:", { cityName, currentTemp, currentWeather, highTemp, lowTemp });
    console.log("Previsão recebida pelo WeatherCard:", forecast);

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
                boxSizing: 'border-box',
                transition: 'all 0.2s ease',
                '&:hover': {
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.08)',
                    borderColor: '#d0d7e6'
                }
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
                        {currentTemp !== undefined ? `${currentTemp}°` : "--°"}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', ml: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#172554', fontSize: '0.85rem' }}>
                                {currentWeather ? getWeatherLabel(currentWeather) : "Indisponível"}
                            </Typography>
                            {currentWeather && weatherIcons[currentWeather] ? weatherIcons[currentWeather] : <CloudIcon sx={{ fontSize: 18, color: '#6b7280' }} />}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#172554', fontSize: '0.85rem', mt: 0.5 }}>
                            Max:{highTemp !== undefined ? `${highTemp}°` : "--°"} Min:{lowTemp !== undefined ? `${lowTemp}°` : "--°"}
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
                {Array.isArray(forecast) && forecast.length > 0 ? (
                    // Mostramos exatamente os 2 dias de previsão (amanhã e depois)
                    forecast.slice(0, 2).map((day, index) => (
                        <Box key={index} sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '45%',
                            padding: '6px',
                            borderRadius: '12px',
                            transition: 'background-color 0.2s ease',
                            '&:hover': {
                                backgroundColor: 'rgba(241, 245, 249, 0.8)'
                            }
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

                            {weatherIcons[day.weather] || <CloudIcon sx={{ fontSize: 18, color: '#6b7280' }} />}

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
                                    lineHeight: 1,
                                    ml: 1
                                }}>
                                    {day.highTemp}°
                                </Typography>
                            </Box>
                        </Box>
                    ))
                ) : (
                    // Mensagem de fallback quando não há previsão
                    <Typography variant="body2" sx={{
                        fontWeight: 500,
                        color: '#64748b',
                        fontSize: '0.85rem',
                        width: '100%',
                        textAlign: 'center'
                    }}>
                        Previsão para os próximos dias não disponível
                    </Typography>
                )}
            </Box>
        </Paper>
    );
};

export default WeatherCard;