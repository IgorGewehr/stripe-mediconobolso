// BrowserImageProcessor.jsx
import React, { useState } from 'react';
import Tesseract from 'tesseract.js';

const BrowserImageProcessor = ({ file, onComplete, onError, onProgress }) => {
    const processImage = async () => {
        try {
            // Criar worker do Tesseract
            const worker = await Tesseract.createWorker('por');

            // Configurar handler de progresso
            worker.setProgressHandler((progress) => {
                if (onProgress) {
                    onProgress(progress);
                }
            });

            // Reconhecer texto da imagem
            const result = await worker.recognize(file);

            // Liberar recursos
            await worker.terminate();

            // Retornar o texto extraído
            if (result.data && result.data.text) {
                onComplete(result.data.text);
            } else {
                onError('Não foi possível extrair texto desta imagem');
            }
        } catch (error) {
            console.error('Erro ao processar imagem:', error);
            onError(error.message || 'Erro ao processar imagem');
        }
    };

    // Iniciar processamento assim que o componente montar
    React.useEffect(() => {
        if (file) {
            processImage();
        }
    }, [file]);

    return null; // Componente sem renderização própria
};

export default BrowserImageProcessor;