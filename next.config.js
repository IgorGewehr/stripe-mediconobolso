/** @type {import('next').NextConfig} */
const nextConfig = {
    // Configuração para o Netlify
    output: 'standalone',

    // serverExternalPackages para pacotes que devem ser tratados como externos
    serverExternalPackages: ['sharp', 'tesseract.js', 'mammoth', 'puppeteer', 'pdf-img-convert'],

    // Configurações experimentais
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },

    // Turbopack config (Next.js 16 usa Turbopack por padrão)
    turbopack: {
        resolveAlias: {
            canvas: './empty-module.js',
        },
    },

    // Webpack config (para builds com --webpack)
    webpack: (config, { isServer }) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            canvas: false,
        };

        if (isServer) {
            config.externals = [
                ...(config.externals || []),
                'sharp',
                'puppeteer',
                'tesseract.js',
                'canvas'
            ];
        }

        config.performance = {
            ...config.performance,
            maxEntrypointSize: 512000,
            maxAssetSize: 512000,
        };

        return config;
    },
}

module.exports = nextConfig
