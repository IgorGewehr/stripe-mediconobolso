// app/not-found.js
'use client';

import React, { Suspense } from 'react';

function NotFoundContent() {
    // Se você realmente precisar de useSearchParams, use-o aqui
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-4xl font-bold mb-4">Página não encontrada</h1>
            <p className="text-lg mb-6">O conteúdo que você procura não está disponível.</p>
            <a href="/" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Voltar para a página inicial
            </a>
        </div>
    );
}

export default function NotFound() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <NotFoundContent />
        </Suspense>
    );
}