'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Paper,
  IconButton,
  CircularProgress,
  Typography,
  Fade,
  Box,
  Tooltip,
  Grow,
  LinearProgress
} from '@mui/material';
import {
  Mic,
  MicOff,
  Stop,
  Close,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingVoiceRecorder = ({ 
  onTranscription, 
  onClose, 
  position = 'top-right',
  context = 'chat' 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  const positionStyles = {
    'top-right': { top: 20, right: 20 },
    'top-left': { top: 20, left: 20 },
    'bottom-right': { bottom: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 }
  };

  const updateAudioLevel = useCallback(() => {
    if (analyserRef.current && isRecording) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255);
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup audio analysis
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError('');
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Start audio level monitoring
      updateAudioLevel();
    } catch (err) {
      setError('Erro ao acessar o microfone');
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setRecordingTime(0);
    setAudioLevel(0);
  };

  const processAudio = async (audioBlob) => {
    setIsProcessing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('context', context);

      const response = await fetch('/api/audio-processing', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao processar áudio');
      }

      const data = await response.json();
      
      if (data.transcription) {
        setSuccess(true);
        onTranscription(data.transcription);
        
        // Auto close after success
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch (err) {
      setError('Erro ao processar áudio');
      console.error('Error processing audio:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    stopRecording();
    onClose();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          ...positionStyles[position],
          zIndex: 1300,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 2,
            borderRadius: 3,
            minWidth: isRecording || isProcessing ? 280 : 200,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="subtitle2" color="textSecondary">
              Gravação de Voz
            </Typography>
            <IconButton size="small" onClick={handleClose} sx={{ ml: 1 }}>
              <Close fontSize="small" />
            </IconButton>
          </Box>

          <Box display="flex" alignItems="center" gap={2}>
            {!isRecording && !isProcessing && !success && (
              <Tooltip title="Iniciar gravação">
                <IconButton
                  onClick={startRecording}
                  disabled={isProcessing}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    width: 56,
                    height: 56,
                  }}
                >
                  <Mic />
                </IconButton>
              </Tooltip>
            )}

            {isRecording && (
              <>
                <Box position="relative" display="inline-flex">
                  <IconButton
                    onClick={stopRecording}
                    sx={{
                      bgcolor: 'error.main',
                      color: 'white',
                      '&:hover': { bgcolor: 'error.dark' },
                      width: 56,
                      height: 56,
                    }}
                  >
                    <Stop />
                  </IconButton>
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: -4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <CircularProgress
                      variant="determinate"
                      value={audioLevel * 100}
                      size={68}
                      thickness={2}
                      sx={{
                        color: 'primary.main',
                        opacity: 0.3,
                      }}
                    />
                  </Box>
                </Box>
                <Box flex={1}>
                  <Typography variant="h6" color="error" gutterBottom>
                    {formatTime(recordingTime)}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={audioLevel * 100}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: 'error.main',
                      },
                    }}
                  />
                </Box>
              </>
            )}

            {isProcessing && (
              <>
                <CircularProgress size={40} />
                <Typography variant="body2" color="textSecondary">
                  Processando...
                </Typography>
              </>
            )}

            {success && (
              <Grow in={success}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircle color="success" sx={{ fontSize: 40 }} />
                  <Typography variant="body2" color="success.main">
                    Transcrito com sucesso!
                  </Typography>
                </Box>
              </Grow>
            )}
          </Box>

          {error && (
            <Fade in={!!error}>
              <Box display="flex" alignItems="center" gap={1} mt={2}>
                <ErrorIcon color="error" fontSize="small" />
                <Typography variant="caption" color="error">
                  {error}
                </Typography>
              </Box>
            </Fade>
          )}
        </Paper>
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingVoiceRecorder;