"use client";

import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import GrainIcon from '@mui/icons-material/Grain';
import CloudIcon from '@mui/icons-material/Cloud';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';

const weatherIcons = {
    Clear: <WbSunnyIcon sx={{ fontSize: 32, color: '#F59E0B' }} />,
    Rain: <GrainIcon sx={{ fontSize: 32, color: '#3B82F6' }} />,
    Snow: <AcUnitIcon sx={{ fontSize: 32, color: '#64748B' }} />,
    Clouds: <CloudIcon sx={{ fontSize: 32, color: '#94A3B8' }} />
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
    return (
        <Paper
            elevation={0}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: 2.5,
                borderRadius: '16px',
                height: '180px',
                width: '100%',
                border: 'none',
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F9FF 50%, #E0F2FE 100%)',
                boxSizing: 'border-box',
                transition: 'all 0.3s ease',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden',
                position: 'relative',
                '&:hover': {
                    boxShadow: '0 8px 24px rgba(37, 99, 235, 0.12)',
                    transform: 'translateY(-2px)',
                }
            }}
        >
            {/* Elemento decorativo de fundo */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'rgba(251, 191, 36, 0.1)',
                    filter: 'blur(20px)',
                }}
            />

            {/* Header com localizacao e icone */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                position: 'relative',
                zIndex: 1,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOnOutlinedIcon sx={{
                        width: 14,
                        height: 14,
                        color: '#64748B'
                    }} />
                    <Typography sx={{
                        fontWeight: 500,
                        color: '#64748B',
                        fontSize: '13px',
                        fontFamily: "'Inter', sans-serif",
                    }}>
                        {cityName || "Sao Paulo"}
                    </Typography>
                </Box>
                {currentWeather && weatherIcons[currentWeather]
                    ? weatherIcons[currentWeather]
                    : <WbSunnyIcon sx={{ fontSize: 32, color: '#F59E0B' }} />
                }
            </Box>

            {/* Temperatura principal */}
            <Box sx={{
                position: 'relative',
                zIndex: 1,
                mt: 1,
            }}>
                <Typography sx={{
                    fontWeight: 700,
                    color: '#0F172A',
                    fontSize: '40px',
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                    fontFamily: "'Inter', sans-serif",
                }}>
                    {currentTemp !== undefined ? `${Math.round(currentTemp)}` : "--"}
                    <Typography
                        component="span"
                        sx={{
                            fontSize: '24px',
                            fontWeight: 600,
                            color: '#64748B',
                        }}
                    >
                        o
                    </Typography>
                </Typography>

                <Typography sx={{
                    fontWeight: 500,
                    color: '#64748B',
                    fontSize: '14px',
                    mt: 0.5,
                    fontFamily: "'Inter', sans-serif",
                }}>
                    {currentWeather ? getWeatherLabel(currentWeather) : "Carregando..."}
                </Typography>

                <Box sx={{
                    display: 'flex',
                    gap: 2,
                    mt: 1,
                }}>
                    <Typography sx={{
                        fontWeight: 500,
                        color: '#94A3B8',
                        fontSize: '12px',
                        fontFamily: "'Inter', sans-serif",
                    }}>
                        H: {highTemp !== undefined ? `${Math.round(highTemp)}` : "--"}o
                    </Typography>
                    <Typography sx={{
                        fontWeight: 500,
                        color: '#94A3B8',
                        fontSize: '12px',
                        fontFamily: "'Inter', sans-serif",
                    }}>
                        L: {lowTemp !== undefined ? `${Math.round(lowTemp)}` : "--"}o
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
};

export default WeatherCard;
