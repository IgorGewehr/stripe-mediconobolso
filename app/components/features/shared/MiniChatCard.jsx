"use client";

import React, { useState, useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Sparkles, Send, Mic, Lock } from "lucide-react";
import { CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import AudioProcessingDialog from '../dialogs/AudioProcessingDialog';
import { useAuth } from '../../providers/authProvider';

const MiniChatCard = () => {
    const { user, isFreeUser } = useAuth();

    // Estados do chat
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [audioDialogOpen, setAudioDialogOpen] = useState(false);
    const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

    // Controle de limite para usuários FREE
    const [freeUsageCount, setFreeUsageCount] = useState(0);
    const FREE_USAGE_LIMIT = 5;

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto scroll para a última mensagem
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Carregar contador de usos FREE
    useEffect(() => {
        if (user?.uid && isFreeUser) {
            loadFreeUsageCount();
        }
    }, [user, isFreeUser]);

    const loadFreeUsageCount = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const usageKey = `miniChat_${user.uid}_${today}`;
            const currentUsage = localStorage.getItem(usageKey) || '0';
            setFreeUsageCount(parseInt(currentUsage));
        } catch (error) {
            console.error("Erro ao carregar contador de usos:", error);
        }
    };

    const incrementFreeUsage = () => {
        if (!isFreeUser) return;

        const today = new Date().toISOString().split('T')[0];
        const usageKey = `miniChat_${user.uid}_${today}`;
        const newCount = freeUsageCount + 1;

        localStorage.setItem(usageKey, newCount.toString());
        setFreeUsageCount(newCount);
    };

    const canUseChatAI = () => {
        if (!isFreeUser) return true;
        return freeUsageCount < FREE_USAGE_LIMIT;
    };

    // Enviar mensagem
    const handleSendMessage = async () => {
        if (!currentMessage.trim() || isLoading) return;

        if (isFreeUser && !canUseChatAI()) {
            setUpgradeDialogOpen(true);
            return;
        }

        const userMessage = currentMessage.trim();
        setCurrentMessage('');
        setError('');
        setIsLoading(true);

        const newUserMessage = {
            id: Date.now(),
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        };

        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);

        try {
            const conversationHistory = messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const response = await fetch('/api/medical-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage,
                    conversationHistory: conversationHistory,
                    userId: user?.uid
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || `Erro ${response.status}`);
            }

            const aiMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: result.message,
                timestamp: new Date(),
                tokensUsed: result.tokensUsed
            };

            setMessages([...updatedMessages, aiMessage]);
            incrementFreeUsage();

        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            setError(error.message || 'Erro ao comunicar com a IA');

            const errorMessage = {
                id: Date.now() + 1,
                role: 'error',
                content: 'Erro na comunicação. Tente novamente.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    const handleAudioResult = (result) => {
        if (result && result.transcription) {
            setCurrentMessage(result.transcription);
            setAudioDialogOpen(false);
            if (!result.analysis) {
                setTimeout(() => handleSendMessage(), 100);
            }
        }
    };

    const suggestions = ["Dosagem Amoxicilina", "Protocolo IAM"];

    return (
        <div className="h-full flex flex-col rounded-xl border-none shadow-lg shadow-indigo-100/50 bg-gradient-to-b from-white to-indigo-50/20 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-indigo-100/50 bg-white/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-700">
                        <Sparkles className="w-5 h-5" />
                        <h3 className="text-lg font-semibold">Doctor AI</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-indigo-600 border border-indigo-200 bg-indigo-50">
                            Beta
                        </span>
                        {isFreeUser && (
                            <span
                                onClick={freeUsageCount >= FREE_USAGE_LIMIT ? () => setUpgradeDialogOpen(true) : undefined}
                                className={cn(
                                    "text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1",
                                    freeUsageCount >= FREE_USAGE_LIMIT
                                        ? "bg-red-50 text-red-600 cursor-pointer hover:bg-red-100"
                                        : "bg-emerald-50 text-emerald-600"
                                )}
                            >
                                {freeUsageCount >= FREE_USAGE_LIMIT && <Lock className="w-3 h-3" />}
                                {freeUsageCount}/{FREE_USAGE_LIMIT}
                            </span>
                        )}
                    </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                    Seu assistente médico inteligente para diagnósticos e protocolos.
                </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {messages.length === 0 ? (
                    // Empty state
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mb-3">
                            <Sparkles className="w-8 h-8 text-indigo-500" />
                        </div>
                        <p className="text-sm font-medium text-slate-500 max-w-[200px] mb-3">
                            Tire dúvidas sobre dosagens, protocolos e diagnósticos.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentMessage(suggestion)}
                                    className="px-3 py-1 text-xs rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    // Messages list
                    <>
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex gap-2",
                                    message.role === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                {message.role !== 'user' && (
                                    <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                                        message.role === 'error' ? "bg-red-500" : "bg-indigo-600"
                                    )}>
                                        {message.role === 'error' ? (
                                            <span className="text-white text-xs">!</span>
                                        ) : (
                                            <Sparkles className="w-3 h-3 text-white" />
                                        )}
                                    </div>
                                )}
                                <div className={cn(
                                    "max-w-[80%] px-3 py-2 text-sm rounded-2xl",
                                    message.role === 'user'
                                        ? "bg-indigo-600 text-white rounded-tr-sm"
                                        : message.role === 'error'
                                            ? "bg-red-50 text-red-700 border border-red-200 rounded-tl-sm"
                                            : "bg-white text-slate-700 border border-slate-100 rounded-tl-sm shadow-sm"
                                )}>
                                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                </div>
                                {message.role === 'user' && (
                                    <div className="w-6 h-6 rounded-full bg-slate-400 flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-xs font-medium">
                                            {user?.fullName?.[0]?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-2 justify-start">
                                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                                    <Sparkles className="w-3 h-3 text-white" />
                                </div>
                                <div className="px-3 py-2 bg-white border border-slate-100 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                                    <CircularProgress size={12} sx={{ color: '#6366F1' }} />
                                    <span className="text-xs text-slate-500">Analisando...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="mx-4 mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">×</button>
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white/80 backdrop-blur border-t border-indigo-100/50">
                <div className="relative flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Faça uma pergunta médica..."
                        disabled={isLoading}
                        className="flex-1 h-12 pl-4 pr-4 rounded-xl border border-indigo-100 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none shadow-sm text-sm disabled:bg-slate-50 disabled:text-slate-400"
                    />
                    <button
                        onClick={() => setAudioDialogOpen(true)}
                        disabled={isLoading}
                        className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all disabled:bg-slate-300 disabled:shadow-none"
                    >
                        <Mic className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleSendMessage}
                        disabled={!currentMessage.trim() || isLoading}
                        className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 transition-all disabled:bg-slate-300 disabled:shadow-none"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Audio Processing Dialog */}
            <AudioProcessingDialog
                open={audioDialogOpen}
                onClose={() => setAudioDialogOpen(false)}
                onResult={handleAudioResult}
            />

            {/* Upgrade Dialog */}
            <Dialog
                open={upgradeDialogOpen}
                onClose={() => setUpgradeDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}
            >
                <DialogTitle className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">Limite de Uso Atingido</h3>
                        <p className="text-sm text-slate-500">Plano Gratuito</p>
                    </div>
                </DialogTitle>
                <DialogContent>
                    <p className="text-slate-600 mb-4">
                        Você atingiu o limite de {FREE_USAGE_LIMIT} usos diários do Doctor AI.
                    </p>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Uso atual:</span>
                            <span className="text-lg font-bold text-red-600">{freeUsageCount}/{FREE_USAGE_LIMIT}</span>
                        </div>
                    </div>
                    <p className="text-slate-600 mb-4">
                        Para continuar usando, faça upgrade para um plano pago:
                    </p>
                    <div className="space-y-3">
                        <div className="border border-slate-200 rounded-lg p-3 flex justify-between items-center">
                            <div>
                                <h4 className="font-semibold text-slate-800">Plano Mensal</h4>
                                <p className="text-xs text-slate-500">Uso ilimitado + recursos avançados</p>
                            </div>
                            <span className="font-bold text-emerald-600">R$ 29,90/mês</span>
                        </div>
                        <div className="border-2 border-emerald-500 bg-emerald-50 rounded-lg p-3 flex justify-between items-center">
                            <div>
                                <h4 className="font-semibold text-slate-800">Plano Anual</h4>
                                <p className="text-xs text-slate-500">Economia de 30% + todos os recursos</p>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-emerald-600">R$ 299,90/ano</span>
                                <p className="text-xs text-slate-500">(~R$ 25/mês)</p>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 text-center mt-4">
                        O limite será renovado automaticamente amanhã às 00:00.
                    </p>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setUpgradeDialogOpen(false)} sx={{ color: '#64748B' }}>
                        Fechar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => window.open('/assinatura', '_blank')}
                        sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, borderRadius: '8px', px: 3 }}
                    >
                        Fazer Upgrade
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default MiniChatCard;
