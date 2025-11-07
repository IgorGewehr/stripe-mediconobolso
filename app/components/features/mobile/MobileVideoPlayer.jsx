'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    IconButton,
    Typography,
    CircularProgress,
    Fade,
    useTheme
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

const MobileVideoPlayer = () => {
    const theme = useTheme();
    const videoRef = useRef(null);
    const containerRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [error, setError] = useState(false);

    const videoUrl = "https://firebasestorage.googleapis.com/v0/b/projeto-med-19a8b.firebasestorage.app/o/tuomobile.mp4?alt=media&token=9edb5a2b-3c58-4ad9-adb6-126bd44ed0d8";

    // Timer para esconder controles
    const controlsTimer = useRef(null);

    // Função para resetar timer dos controles
    const resetControlsTimer = () => {
        if (controlsTimer.current) {
            clearTimeout(controlsTimer.current);
        }
        setShowControls(true);

        if (isPlaying) {
            controlsTimer.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
    };

    // Event listeners do vídeo
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLoadedData = () => {
            setIsLoading(false);
            setDuration(video.duration);
        };

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
            setProgress((video.currentTime / video.duration) * 100);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setShowControls(true);
        };

        const handleError = () => {
            setError(true);
            setIsLoading(false);
        };

        video.addEventListener('loadeddata', handleLoadedData);
        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('error', handleError);

        return () => {
            video.removeEventListener('loadeddata', handleLoadedData);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('error', handleError);
        };
    }, []);

    // Cleanup timer
    useEffect(() => {
        return () => {
            if (controlsTimer.current) {
                clearTimeout(controlsTimer.current);
            }
        };
    }, []);

    // Controle de play/pause
    const togglePlayPause = () => {
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) {
            video.pause();
            setIsPlaying(false);
        } else {
            video.play();
            setIsPlaying(true);
        }
        resetControlsTimer();
    };

    // Controle de mute
    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;

        video.muted = !video.muted;
        setIsMuted(video.muted);
        resetControlsTimer();
    };

    // Controle de fullscreen
    const toggleFullscreen = () => {
        const container = containerRef.current;
        if (!container) return;

        if (!isFullscreen) {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.mozRequestFullScreen) {
                container.mozRequestFullScreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            }
        }
    };

    // Listener para mudanças de fullscreen
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Função para buscar posição no vídeo
    const handleProgressClick = (e) => {
        const video = videoRef.current;
        const progressBar = e.currentTarget;
        if (!video || !progressBar) return;

        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        const newTime = (clickX / width) * duration;

        video.currentTime = newTime;
        resetControlsTimer();
    };

    // Formatar tempo
    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Handle touch/click para mostrar controles
    const handleVideoInteraction = () => {
        resetControlsTimer();
    };

    if (error) {
        return (
            <Box sx={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#000',
                color: 'white',
                textAlign: 'center',
                p: 3
            }}>
                <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Erro ao carregar o vídeo
                    </Typography>
                    <Typography variant="body2" color="error">
                        Não foi possível reproduzir o conteúdo
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box
            ref={containerRef}
            sx={{
                position: 'relative',
                height: '100vh',
                width: '100vw',
                backgroundColor: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                touchAction: 'manipulation'
            }}
            onClick={handleVideoInteraction}
            onTouchStart={handleVideoInteraction}
        >
            {/* Vídeo */}
            <video
                ref={videoRef}
                src={videoUrl}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                }}
                playsInline
                preload="metadata"
                onLoadStart={() => setIsLoading(true)}
            />

            {/* Loading */}
            {isLoading && (
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2
                }}>
                    <CircularProgress sx={{ color: 'white' }} size={48} />
                    <Typography variant="body2" sx={{ color: 'white' }}>
                        Carregando vídeo...
                    </Typography>
                </Box>
            )}

            {/* Controles do vídeo */}
            <Fade in={showControls && !isLoading} timeout={300}>
                <Box sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2
                }}>
                    {/* Barra de progresso */}
                    <Box
                        sx={{
                            width: '100%',
                            height: 4,
                            backgroundColor: 'rgba(255,255,255,0.3)',
                            borderRadius: 2,
                            cursor: 'pointer',
                            position: 'relative'
                        }}
                        onClick={handleProgressClick}
                    >
                        <Box
                            sx={{
                                width: `${progress}%`,
                                height: '100%',
                                backgroundColor: theme.palette.primary.main,
                                borderRadius: 2,
                                transition: 'width 0.1s ease'
                            }}
                        />
                    </Box>

                    {/* Controles */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%'
                    }}>
                        {/* Play/Pause */}
                        <IconButton
                            onClick={togglePlayPause}
                            sx={{
                                color: 'white',
                                fontSize: '2rem',
                                p: 1
                            }}
                        >
                            {isPlaying ? <PauseIcon fontSize="inherit" /> : <PlayArrowIcon fontSize="inherit" />}
                        </IconButton>

                        {/* Tempo */}
                        <Typography variant="body2" sx={{ color: 'white', mx: 2 }}>
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </Typography>

                        {/* Controles direita */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {/* Mute */}
                            <IconButton
                                onClick={toggleMute}
                                sx={{ color: 'white', p: 1 }}
                            >
                                {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                            </IconButton>

                            {/* Fullscreen */}
                            <IconButton
                                onClick={toggleFullscreen}
                                sx={{ color: 'white', p: 1 }}
                            >
                                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                            </IconButton>
                        </Box>
                    </Box>
                </Box>
            </Fade>

            {/* Botão de play central (quando pausado) */}
            {!isPlaying && !isLoading && (
                <Fade in={showControls} timeout={300}>
                    <IconButton
                        onClick={togglePlayPause}
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            width: 80,
                            height: 80,
                            fontSize: '3rem',
                            '&:hover': {
                                backgroundColor: 'rgba(0,0,0,0.8)',
                            }
                        }}
                    >
                        <PlayArrowIcon fontSize="inherit" />
                    </IconButton>
                </Fade>
            )}
        </Box>
    );
};

export default MobileVideoPlayer;