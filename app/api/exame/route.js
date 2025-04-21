import { NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

export const dynamic = 'force-dynamic';

// Extrai texto via OCR usando sharp + tesseract.js
async function extractTextWithOCR(pdfBuffer) {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    const worker = await createWorker();
    await worker.loadLanguage('por');
    await worker.initialize('por');

    let fullText = '';
    for (let i = 0; i < pageCount; i++) {
        const subPdf = await PDFDocument.create();
        const [page] = await subPdf.copyPages(pdfDoc, [i]);
        subPdf.addPage(page);
        const pageBytes = await subPdf.save();

        // Converte a página para PNG em memória
        const imageBuffer = await sharp(pageBytes, { density: 300 })
            .png()
            .toBuffer();

        const { data } = await worker.recognize(imageBuffer);
        fullText += data.text + '\n\n';
    }

    await worker.terminate();
    return fullText;
}

export async function POST(req) {
    // Aceita somente upload via FormData
    const formData = await req.formData().catch(() => null);
    if (!formData) {
        return NextResponse.json(
            { error: 'Requisição inválida', details: 'Use FormData com campo "file" contendo o PDF' },
            { status: 400 }
        );
    }

    const file = formData.get('file');
    if (!file) {
        return NextResponse.json(
            { error: 'Arquivo não fornecido', details: 'Inclua o PDF no campo "file"' },
            { status: 400 }
        );
    }

    // Converte para Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1) Tenta extrair texto via pdf-parse
    let text = '';
    try {
        const pdfParse = (await import('pdf-parse')).default;
        const data = await pdfParse(buffer);
        text = data.text || '';
        // Se texto insuficiente, força OCR
        if (!text.trim() || text.length < 50) {
            throw new Error('Texto insuficiente');
        }
    } catch {
        // 2) Fallback para OCR
        text = await extractTextWithOCR(buffer);
        if (!text.trim()) {
            return NextResponse.json(
                { error: 'Falha ao extrair texto', details: 'OCR não retornou texto suficiente' },
                { status: 400 }
            );
        }
    }

    // Trunca se necessário
    const maxLength = 15000;
    const truncatedText =
        text.length > maxLength
            ? text.substring(0, maxLength) + '... [texto truncado]'
            : text;

    // Verifica variável de ambiente
    if (!process.env.OPENAI_KEY) {
        return NextResponse.json(
            { error: 'API key não configurada', details: 'Defina OPENAI_KEY no ambiente' },
            { status: 500 }
        );
    }

    try {
        const { OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            temperature: 0.2,
            messages: [
                { role: 'system', content: 'Você é um assistente especializado em processar resultados de exames médicos.' },
                {
                    role: 'user',
                    content: `Analise o texto abaixo e extraia resultados em JSON agrupado por categoria.\n\nTexto:\n${truncatedText}`
                }
            ],
            response_format: { type: 'json_object' }
        });

        const resultText = response.choices[0].message.content;
        const jsonResult = JSON.parse(resultText);

        return NextResponse.json({ success: true, data: jsonResult });
    } catch (err) {
        console.error('Erro OpenAI:', err);
        return NextResponse.json(
            { error: 'Falha IA', details: err.message },
            { status: 500 }
        );
    }
}
