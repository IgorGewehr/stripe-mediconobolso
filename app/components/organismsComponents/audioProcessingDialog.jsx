"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    Box,
    Typography,
    Button,
    IconButton,
    Avatar,
    CircularProgress,
    Paper,
    useTheme,
    useMediaQuery,
    Divider,
    Fade,
    Alert,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tooltip,
    LinearProgress
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import StopIcon from "@mui/icons-material/Stop";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AudioFileIcon from "@mui/icons-material/AudioFile";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const AudioProcessingDialog = ({ open, onClose, onResult }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [analysisType, setAnalysisType] = useState('general');
    const [transcriptionOnly, setTranscriptionOnly] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [dragActive, setDragActive] = useState(false);

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const mediaRecorderRef = useRef(null);
    const audioRef = useRef(null);
    const timerRef = useRef(null);
    const fileInputRef = useRef(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [audioUrl]);

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (!open) {
            handleReset();
        }
    }, [open]);

    const handleReset = () => {
        setIsRecording(false);
        setAudioBlob(null);
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
        setIsPlaying(false);
        setIsProcessing(false);
        setProcessingStep('');
        setResult(null);
        setError('');
        setRecordingTime(0);
        setDragActive(false);
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    // Start recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            const chunks = [];
            mediaRecorder.ondataavailable = (event) => {
                chunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setError('');
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            setError('Erro ao acessar microfone. Verifique as permissões.');
        }
    };

    // Stop recording
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    // Play/pause audio
    const toggleAudioPlayback = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    // Handle file upload
    const handleFileUpload = (file) => {
        if (file && file.type.startsWith('audio/')) {
            setAudioBlob(file);
            setAudioUrl(URL.createObjectURL(file));
            setError('');
        } else {
            setError('Por favor, selecione um arquivo de áudio válido');
        }
    };

    // Handle drag and drop
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    // Process audio
    const processAudio = async () => {
        if (!audioBlob) return;

        setIsProcessing(true);
        setError('');
        setResult(null);

        try {
            setProcessingStep('Preparando áudio...');
            
            const formData = new FormData();
            formData.append('audio', audioBlob, 'audio.webm');
            formData.append('analysisType', analysisType);
            formData.append('transcriptionOnly', transcriptionOnly.toString());

            setProcessingStep('Transcrevendo áudio...');
            
            const response = await fetch('/api/audio-processing', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Erro no processamento');
            }

            setProcessingStep('Analisando conteúdo...');
            
            setResult(data);
            
            // Call parent callback if provided
            if (onResult) {
                onResult(data);
            }

        } catch (error) {
            console.error('Error processing audio:', error);
            setError(error.message || 'Erro ao processar áudio');
        } finally {
            setIsProcessing(false);
            setProcessingStep('');
        }
    };

    // Format time display
    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            fullWidth
            maxWidth="md"
            fullScreen={fullScreen}
            PaperProps={{
                sx: {
                    borderRadius: '20px',
                    overflow: 'hidden',
                    height: fullScreen ? '100vh' : 'auto',
                    minHeight: '600px'
                }
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #EAECEF',
                    backgroundColor: '#F8FAFC'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                        sx={{
                            bgcolor: '#1976D2',
                            color: 'white',
                            width: 40,
                            height: 40,
                            mr: 2
                        }}
                    >
                        <RecordVoiceOverIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976D2' }}>
                            Processamento de Áudio
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Transcrição e análise médica por IA
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={handleClose} sx={{ color: '#64748B' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                {/* Configuration */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel>Tipo de Análise</InputLabel>
                            <Select
                                value={analysisType}
                                label="Tipo de Análise"
                                onChange={(e) => setAnalysisType(e.target.value)}
                                disabled={isProcessing}
                            >
                                <MenuItem value="general">Geral</MenuItem>
                                <MenuItem value="consultation">Consulta Médica</MenuItem>
                                <MenuItem value="dictation">Ditado Médico</MenuItem>
                                <MenuItem value="symptoms">Sintomas</MenuItem>
                            </Select>
                        </FormControl>
                        
                        <Button
                            variant={transcriptionOnly ? "contained" : "outlined"}
                            size="small"
                            onClick={() => setTranscriptionOnly(!transcriptionOnly)}
                            disabled={isProcessing}
                        >
                            {transcriptionOnly ? "Transcrição Apenas" : "Análise Completa"}
                        </Button>
                    </Box>
                </Box>

                {/* Recording/Upload Area */}
                <Paper
                    sx={{
                        p: 3,
                        mb: 3,
                        backgroundColor: dragActive ? '#F0F8FF' : '#FAFAFA',
                        border: dragActive ? '2px dashed #1976D2' : '2px dashed #E0E0E0',
                        borderRadius: '12px',
                        textAlign: 'center',
                        transition: 'all 0.2s ease'
                    }}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    {!audioBlob ? (
                        <Box>
                            <Avatar
                                sx={{
                                    bgcolor: isRecording ? '#F44336' : '#1976D2',
                                    width: 60,
                                    height: 60,
                                    mx: 'auto',
                                    mb: 2
                                }}
                            >
                                {isRecording ? <MicIcon /> : <AudioFileIcon />}
                            </Avatar>
                            
                            {isRecording ? (
                                <Box>
                                    <Typography variant="h6" sx={{ mb: 1, color: '#F44336' }}>
                                        Gravando...
                                    </Typography>
                                    <Typography variant="h4" sx={{ mb: 2, color: '#F44336' }}>
                                        {formatTime(recordingTime)}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        onClick={stopRecording}
                                        startIcon={<StopIcon />}
                                        size="large"
                                    >
                                        Parar Gravação
                                    </Button>
                                </Box>
                            ) : (
                                <Box>
                                    <Typography variant="h6" sx={{ mb: 2 }}>
                                        Grave ou faça upload de áudio
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
                                        <Button
                                            variant="contained"
                                            onClick={startRecording}
                                            startIcon={<MicIcon />}
                                            size="large"
                                        >
                                            Gravar
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={() => fileInputRef.current?.click()}
                                            startIcon={<CloudUploadIcon />}
                                            size="large"
                                        >
                                            Upload
                                        </Button>
                                    </Box>
                                    <Typography variant="body2" color="textSecondary">
                                        Formatos suportados: MP3, WAV, M4A, WEBM (máx. 25MB)
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    ) : (
                        <Box>
                            <Avatar
                                sx={{
                                    bgcolor: '#22C55E',
                                    width: 60,
                                    height: 60,
                                    mx: 'auto',
                                    mb: 2
                                }}
                            >
                                <CheckCircleIcon />
                            </Avatar>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Áudio Pronto
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 2 }}>
                                <Button
                                    variant="outlined"
                                    onClick={toggleAudioPlayback}
                                    startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                                >
                                    {isPlaying ? 'Pausar' : 'Reproduzir'}
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={handleReset}
                                    startIcon={<DeleteOutlineIcon />}
                                    color="error"
                                >
                                    Remover
                                </Button>
                            </Box>
                            <Button
                                variant="contained"
                                onClick={processAudio}
                                disabled={isProcessing}
                                startIcon={isProcessing ? <CircularProgress size={20} /> : <SmartToyIcon />}
                                size="large"
                                sx={{ mt: 1 }}
                            >
                                {isProcessing ? 'Processando...' : 'Processar com IA'}
                            </Button>
                        </Box>
                    )}
                </Paper>

                {/* Processing Status */}
                {isProcessing && (
                    <Box sx={{ mb: 3 }}>
                        <LinearProgress sx={{ mb: 2 }} />
                        <Typography variant="body2" color="textSecondary" textAlign="center">
                            {processingStep}
                        </Typography>
                    </Box>
                )}

                {/* Error Display */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* Results */}
                {result && (
                    <Fade in={true}>
                        <Paper sx={{ p: 3, backgroundColor: '#F8FAFC', borderRadius: '12px' }}>
                            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                <CheckCircleIcon sx={{ mr: 1, color: '#22C55E' }} />
                                Resultado do Processamento
                            </Typography>
                            
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                    Transcrição:
                                </Typography>
                                <Paper sx={{ p: 2, backgroundColor: 'white', borderRadius: '8px' }}>
                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                        {result.transcription}
                                    </Typography>
                                </Paper>
                            </Box>

                            {result.analysis && (
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                        Análise Médica:
                                    </Typography>
                                    <Paper sx={{ p: 2, backgroundColor: 'white', borderRadius: '8px' }}>
                                        <pre style={{ 
                                            whiteSpace: 'pre-wrap', 
                                            fontFamily: 'inherit', 
                                            fontSize: '0.875rem',
                                            lineHeight: 1.6,
                                            margin: 0
                                        }}>
                                            {JSON.stringify(result.analysis, null, 2)}
                                        </pre>
                                    </Paper>
                                </Box>
                            )}

                            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                <Chip 
                                    label={`Tipo: ${result.analysisType || 'Geral'}`} 
                                    size="small" 
                                    variant="outlined" 
                                />
                                <Chip 
                                    label={`${result.transcriptionLength} caracteres`} 
                                    size="small" 
                                    variant="outlined" 
                                />
                            </Box>
                        </Paper>
                    </Fade>
                )}

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0]);
                        }
                    }}
                    style={{ display: 'none' }}
                />

                {/* Hidden audio element */}
                {audioUrl && (
                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        onEnded={() => setIsPlaying(false)}
                        onPause={() => setIsPlaying(false)}
                        style={{ display: 'none' }}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};

export default AudioProcessingDialog;