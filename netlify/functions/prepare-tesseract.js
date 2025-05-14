// Este arquivo é executado antes do processamento e prepara o ambiente
const fs = require('fs');
const path = require('path');

// Criar diretório de cache temporário
const cacheDir = '/tmp/tesseract-cache';
if (!fs.existsSync(cacheDir)) {
    try {
        fs.mkdirSync(cacheDir, { recursive: true });
        console.log('Diretório de cache do Tesseract criado com sucesso');
    } catch (err) {
        console.error('Erro ao criar diretório de cache:', err);
    }
}

// Arquivo vazio para evitar tentativa de escrita no sistema
process.env.TESSDATA_PREFIX = cacheDir;