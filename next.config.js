/** @type {import('next').NextConfig} */
const nextConfig = {
    // Mantendo sua configuração para o Netlify
    output: 'standalone',

    // serverExternalPackages é o novo nome para serverComponentsExternalPackages
    serverExternalPackages: ['sharp', 'tesseract.js', 'mammoth', 'puppeteer', 'pdf-img-convert'],

    // Configurações experimentais atualizadas
    experimental: {
        esmExternals: true,
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },

    // Mesclando suas configurações webpack existentes com as novas
    webpack: (config, { isServer }) => {
        // Mantendo seu fallback para fs
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
        };

        // Adicionando configurações para pacotes nativos
        if (isServer) {
            config.externals = [
                ...(config.externals || []),
                'sharp',
                'puppeteer',
                'tesseract.js'
            ];
        }

        // Aumentar limites para processamento de arquivos grandes
        config.performance = {
            ...config.performance,
            maxEntrypointSize: 512000,
            maxAssetSize: 512000,
        };

        return config;
    },

    // Aumentar os limites de tamanho para arquivos grandes (usando nova sintaxe)
    serverRuntimeConfig: {
        responseLimit: '30mb',
    },
    publicRuntimeConfig: {
        maxFileSize: '15mb',
    },
}

module.exports = nextConfig