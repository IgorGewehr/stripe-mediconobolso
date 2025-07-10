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

const AudioProcessingDialog = ({ open, onClose, onResult, defaultAnalysisType = 'general' }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [analysisType, setAnalysisType] = useState(defaultAnalysisType);
    const [transcriptionOnly, setTranscriptionOnly] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [dragActive, setDragActive] = useState(false);

    const theme = useTheme();
    const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
    const mediaRecorderRef = useRef(null);
    const audioRef = useRef(null);
    const timerRef = useRef(null);
    const fileInputRef = useRef(null);

    // Cleanup on unmount and audio URL changes
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

    // Cleanup previous audio URL when new one is created
    useEffect(() => {
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, []);

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (!open) {
            handleReset();
        }
    }, [open]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Ensure everything is cleaned up when component unmounts
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, []);

    const handleReset = () => {
        // Stop recording if active
        if (mediaRecorderRef.current) {
            if (mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            mediaRecorderRef.current = null;
        }
        
        // Stop all tracks in the stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
            });
            streamRef.current = null;
        }
        
        // Clear timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        
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
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    // Check microphone permissions
    const checkMicrophonePermissions = async () => {
        try {
            const result = await navigator.permissions.query({ name: 'microphone' });
            return result.state;
        } catch (error) {
            return 'unknown';
        }
    };

    // Start recording with better error handling
    const startRecording = async () => {
        try {
            // Check permissions first
            const permissionState = await checkMicrophonePermissions();
            if (permissionState === 'denied') {
                setError('Permissão de microfone negada. Ative nas configurações do navegador.');
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });
            
            // Use better codec if available
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : 'audio/mp4';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;

            const chunks = [];
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: mimeType });
                // Cleanup previous audio URL
                if (audioUrl) {
                    URL.revokeObjectURL(audioUrl);
                }
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                setError('Erro durante a gravação. Tente novamente.');
                setIsRecording(false);
            };

            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);
            setError('');
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            if (error.name === 'NotAllowedError') {
                setError('Permissão de microfone negada. Ative nas configurações do navegador.');
            } else if (error.name === 'NotFoundError') {
                setError('Nenhum microfone encontrado. Conecte um microfone e tente novamente.');
            } else {
                setError('Erro ao acessar microfone. Verifique as permissões e tente novamente.');
            }
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

    // Handle file upload with validation
    const handleFileUpload = (file) => {
        if (!file) {
            setError('Nenhum arquivo selecionado');
            return;
        }

        // Validate file type
        const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/webm', 'audio/mp4'];
        const validExtensions = ['.mp3', '.wav', '.m4a', '.webm', '.mp4', '.mpeg'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        
        const isValidType = validTypes.some(type => file.type.includes(type)) || file.type.startsWith('audio/');
        const isValidExtension = validExtensions.includes(fileExtension);

        if (!isValidType && !isValidExtension) {
            setError('Formato de arquivo não suportado. Use MP3, WAV, M4A, WEBM ou MP4.');
            return;
        }

        // Validate file size (25MB limit)
        const maxSize = 25 * 1024 * 1024; // 25MB
        if (file.size > maxSize) {
            setError('Arquivo muito grande. O tamanho máximo é 25MB.');
            return;
        }

        // Cleanup previous audio URL
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }

        setAudioBlob(file);
        setAudioUrl(URL.createObjectURL(file));
        setError('');
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
                                <MenuItem value="anamnese">Anamnese Completa</MenuItem>
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