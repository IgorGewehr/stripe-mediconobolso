// hooks/useResponsiveScale.js
import { useState, useEffect } from 'react';

export function useResponsiveScale() {
    const [scale, setScale] = useState(1);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        // Função para calcular a escala com base na largura da tela
        const calculateScale = () => {
            const screenWidth = window.innerWidth;
            setWidth(screenWidth);

            // Ajuste os valores conforme necessário para seus dispositivos específicos
            if (screenWidth <= 1366) { // Cerca de 13-14"
                setScale(0.85); // Menor para telas pequenas
            } else if (screenWidth <= 1536) { // Cerca de 15"
                setScale(0.95); // Seu valor original
            } else if (screenWidth <= 1920) { // Cerca de 16"
                setScale(1.05); // Um pouco maior
            } else { // Monitores grandes
                setScale(1.15); // Maior para telas grandes
            }
        };

        // Calcula na inicialização
        calculateScale();

        // Recalcula quando a janela é redimensionada
        window.addEventListener('resize', calculateScale);

        // Limpeza
        return () => window.removeEventListener('resize', calculateScale);
    }, []);

    // Retorna tanto a escala calculada quanto o estilo completo para uso fácil
    return {
        scale,
        width,
        scaleStyle: {
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: `${(100 / scale)}%`,
            height: `${(100 / scale)}%`,
        }
    };
}