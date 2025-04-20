/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
        };
        return config;
    },
    // Esta configuração é importante para o Netlify
    output: 'standalone'
}

module.exports = nextConfig