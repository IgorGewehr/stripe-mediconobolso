import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Declare a rota como dinâmica para o Netlify
export const dynamic = 'force-dynamic';

// Função para OCR em ambiente Node.js
async function extractTextWithOCR(pdfBuffer) {
    try {
        console.log("Iniciando OCR no servidor...");

        // Criar diretório temporário para processamento
        const tempDir = path.join(os.tmpdir(), `pdf-ocr-${Date.now()}`);
        await fs.promises.mkdir(tempDir, { recursive: true });
        const tempPdfPath = path.join(tempDir, 'temp.pdf');

        // Salvar o buffer como arquivo temporário
        await fs.promises.writeFile(tempPdfPath, pdfBuffer);
        console.log(`PDF temporário salvo em: ${tempPdfPath}`);

        // Importar bibliotecas necessárias
        const { createWorker } = await import('tesseract.js');
        const { PDFDocument } = await import('pdf-lib');
        const sharp = await import('sharp');

        // Carregar o PDF usando pdf-lib
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pageCount = pdfDoc.getPageCount();
        console.log(`PDF tem ${pageCount} páginas`);

        // Configurar worker do Tesseract
        const worker = await createWorker('por');

        let fullText = '';

        // Processar cada página
        for (let i = 0; i < pageCount; i++) {
            try {
                console.log(`Processando página ${i + 1}/${pageCount}`);

                // Extrair página como PDF separado
                const subPdf = await PDFDocument.create();
                const [page] = await subPdf.copyPages(pdfDoc, [i]);
                subPdf.addPage(page);
                const pagePdfBytes = await subPdf.save();

                // Salvar página como PDF temporário
                const pagePdfPath = path.join(tempDir, `page-${i}.pdf`);
                await fs.promises.writeFile(pagePdfPath, pagePdfBytes);

                // Converter PDF para imagem usando pdf-poppler (se instalado)
                // Nota: Isso requer que o poppler-utils esteja instalado no sistema
                try {
                    const { default: pdf2pic } = await import('pdf2pic');

                    const converter = pdf2pic({
                        density: 300,
                        savename: `page-${i}`,
                        savedir: tempDir,
                        format: 'png',
                        size: 3000
                    });

                    const result = await converter.convert(pagePdfPath);
                    console.log(`Página ${i + 1} convertida para imagem`);

                    // Executar OCR na imagem
                    const { data } = await worker.recognize(result.path);
                    fullText += data.text + '\n\n';
                } catch (pdf2picError) {
                    console.error("Erro no pdf2pic, tentando alternativa:", pdf2picError);

                    // Método alternativo usando puppeteer se pdf2pic falhar
                    try {
                        const { default: puppeteer } = await import('puppeteer');
                        const browser = await puppeteer.launch();
                        const page = await browser.newPage();

                        // Carregar o PDF como data URL
                        const pdfBase64 = pagePdfBytes.toString('base64');
                        const dataUrl = `data:application/pdf;base64,${pdfBase64}`;
                        await page.goto(dataUrl, { waitUntil: 'networkidle0' });

                        // Capturar screenshot
                        const imagePath = path.join(tempDir, `page-${i}.png`);
                        await page.screenshot({ path: imagePath, fullPage: true });
                        await browser.close();

                        // Executar OCR na imagem capturada
                        const { data } = await worker.recognize(imagePath);
                        fullText += data.text + '\n\n';
                    } catch (puppeteerError) {
                        console.error("Ambos métodos de conversão falharam:", puppeteerError);
                        throw new Error("Falha na conversão PDF para imagem");
                    }
                }
            } catch (pageError) {
                console.error(`Erro ao processar página ${i + 1}:`, pageError);
            }
        }

        // Limpar recursos
        await worker.terminate();

        // Limpar arquivos temporários
        try {
            const files = await fs.promises.readdir(tempDir);
            for (const file of files) {
                await fs.promises.unlink(path.join(tempDir, file));
            }
            await fs.promises.rmdir(tempDir);
            console.log("Arquivos temporários removidos");
        } catch (cleanupError) {
            console.error("Erro ao limpar arquivos temporários:", cleanupError);
        }

        return fullText;
    } catch (error) {
        console.error('Erro no OCR:', error);
        throw new Error(`Falha ao extrair texto usando OCR: ${error.message}`);
    }
}

export async function POST(req) {
    try {
        let text = "";
        let sourceType = "unknown";

        // Tentar processar como FormData (upload de arquivo)
        try {
            const formData = await req.formData();
            const file = formData.get('file');

            if (file) {
                sourceType = "file-upload";
                console.log(`Processando arquivo: ${file.name}, tipo: ${file.type}, tamanho: ${file.size} bytes`);

                // Converter para Buffer
                const buffer = Buffer.from(await file.arrayBuffer());

                try {
                    // Primeiro, tentar extrair texto com pdf-parse
                    console.log("Iniciando extração de texto do PDF com pdf-parse...");
                    const pdfParseModule = await import('pdf-parse');
                    const pdfParse = pdfParseModule.default;

                    const options = {
                        pagerender: null,
                        max: 0,
                        version: 'v2.0.550'
                    };

                    try {
                        const data = await pdfParse(buffer, options);
                        text = data.text || "";

                        // Verificar se extraiu texto suficiente
                        if (!text.trim() || text.length < 100) {
                            console.log("Texto insuficiente extraído, tentando OCR...");

                            // Tentar extrair com OCR
                            text = await extractTextWithOCR(buffer);

                            if (!text.trim()) {
                                throw new Error("OCR não conseguiu extrair texto suficiente");
                            }
                        }

                        console.log(`Texto extraído com sucesso: ${text.length} caracteres`);
                    } catch (pdfExtractError) {
                        console.error("Erro ao extrair texto com pdf-parse:", pdfExtractError);

                        // Tentar com OCR como fallback
                        try {
                            console.log("Tentando extração com OCR...");
                            text = await extractTextWithOCR(buffer);

                            if (!text.trim()) {
                                throw new Error("OCR falhou ao extrair texto");
                            }

                            console.log(`Texto extraído com OCR: ${text.length} caracteres`);
                        } catch (ocrError) {
                            console.error("Erro no OCR:", ocrError);
                            return NextResponse.json({
                                error: 'Falha ao processar o arquivo PDF',
                                details: "Não foi possível extrair texto do PDF, nem com OCR. O arquivo pode estar danificado ou protegido.",
                                code: "OCR_FAILED"
                            }, { status: 400 });
                        }
                    }
                } catch (processingError) {
                    console.error("Erro ao processar PDF:", processingError);
                    return NextResponse.json({
                        error: 'Falha ao processar o arquivo PDF',
                        details: processingError.message || "Erro interno no processamento do PDF"
                    }, { status: 500 });
                }
            } else {
                return NextResponse.json({
                    error: 'Arquivo não fornecido',
                    details: 'Verifique se o campo "file" está presente no formulário'
                }, { status: 400 });
            }
        } catch (formDataError) {
            // Processar como JSON
            try {
                const body = await req.json();
                sourceType = "json";

                if (body.url) {
                    sourceType = "remote-url";
                    console.log(`Processando URL: ${body.url}`);

                    try {
                        const response = await fetch(body.url);
                        if (!response.ok) {
                            throw new Error(`Falha ao baixar o arquivo: ${response.status} ${response.statusText}`);
                        }

                        // Obter o conteúdo binário
                        const fileBuffer = await response.arrayBuffer();
                        const buffer = Buffer.from(fileBuffer);

                        // Processar o PDF
                        const pdfParseModule = await import('pdf-parse');
                        const pdfParse = pdfParseModule.default;

                        const options = {
                            pagerender: null,
                            max: 0,
                            version: 'v2.0.550'
                        };

                        const data = await pdfParse(buffer, options);
                        text = data.text || "";

                        if (!text.trim()) {
                            text = await extractTextWithOCR(buffer);
                        }

                        console.log(`Texto extraído da URL: ${text.length} caracteres`);
                    } catch (urlError) {
                        console.error("Erro ao processar URL:", urlError);
                        return NextResponse.json({
                            error: 'Falha ao processar o PDF da URL',
                            details: urlError.message
                        }, { status: 500 });
                    }
                } else if (body.text) {
                    sourceType = "direct-text";
                    text = body.text;
                    console.log(`Texto fornecido diretamente: ${text.length} caracteres`);
                } else {
                    return NextResponse.json({
                        error: 'Corpo da requisição inválido',
                        details: 'Esperava um objeto com "text" ou "url"'
                    }, { status: 400 });
                }
            } catch (jsonError) {
                console.error("Erro ao processar corpo da requisição:", jsonError);
                return NextResponse.json({
                    error: 'Formato da requisição inválido',
                    details: 'Esperava FormData (arquivo) ou JSON (text/url)'
                }, { status: 400 });
            }
        }

        // Verificar se temos texto para processar
        if (!text || text.trim().length === 0) {
            return NextResponse.json({
                error: 'Texto não extraído ou vazio',
                details: 'Não foi possível extrair texto do PDF mesmo com OCR'
            }, { status: 400 });
        }

        // Truncar o texto se for muito longo
        const maxLength = 15000;
        const truncatedText = text.length > maxLength
            ? text.substring(0, maxLength) + "... [texto truncado devido ao tamanho]"
            : text;

        console.log(`Texto para processamento (${sourceType}): ${truncatedText.length} caracteres`);

        // Verificar se a chave da API está configurada
        if (!process.env.OPENAI_KEY) {
            console.error('OPENAI_KEY não configurada');
            return NextResponse.json({
                error: 'Configuração da API de IA não encontrada',
                details: 'A variável de ambiente OPENAI_KEY não está configurada'
            }, { status: 500 });
        }

        // Processar com OpenAI
        try {
            console.log("Iniciando processamento com OpenAI...");

            const openai = new OpenAI({
                apiKey: process.env.OPENAI_KEY
            });

            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "Você é um assistente especializado em processar resultados de exames médicos."
                    },
                    {
                        role: "user",
                        content: `
                            Analise o texto do exame médico a seguir e extraia todos os resultados em formato JSON.
                            O resultado deve ser agrupado nas seguintes categorias:
                            - LabGerais: Exames Laboratoriais Gerais
                            - PerfilLipidico: Perfil Lipídico
                            - Hepaticos: Exames Hepáticos e Pancreáticos
                            - Inflamatorios: Inflamatórios e Imunológicos
                            - Hormonais: Hormonais
                            - Vitaminas: Vitaminas e Minerais
                            - Infecciosos: Infecciosos / Sorologias
                            - Tumorais: Marcadores Tumorais
                            - Cardiacos: Cardíacos e Musculares
                            - Imagem: Imagem e Diagnóstico
                            - Outros: Outros Exames
                            
                            Estruture o JSON como:
                            {
                              "LabGerais": {
                                "Hemograma completo": "valor",
                                "Plaquetas": "valor"
                              },
                              "PerfilLipidico": {
                                "Colesterol Total": "valor"
                              }
                            }
                            
                            Inclua apenas as categorias onde houver resultados identificados.
                            Para cada exame, inclua o nome do exame e o resultado completo com unidades.
                            
                            Texto do exame:
                            ${truncatedText}
                        `
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.2
            });

            console.log("Resposta recebida da OpenAI");

            // Extrair e validar o JSON retornado
            const resultText = response.choices[0].message.content;

            try {
                const jsonResult = JSON.parse(resultText);

                // Verificar se há pelo menos alguma categoria de exame
                const categoryCount = Object.keys(jsonResult).length;
                console.log(`Categorias encontradas: ${categoryCount}`);

                if (categoryCount === 0) {
                    return NextResponse.json({
                        success: true,
                        data: {},
                        warning: "Nenhum resultado de exame identificado no texto fornecido",
                        rawText: text.substring(0, 500) + "..." // Primeiros 500 caracteres para diagnóstico
                    });
                }

                return NextResponse.json({
                    success: true,
                    data: jsonResult,
                    source: sourceType,
                    textLength: text.length
                });
            } catch (jsonError) {
                console.error("Erro ao converter resposta para JSON:", jsonError);
                return NextResponse.json({
                    error: "Falha ao converter a resposta da IA para JSON",
                    details: jsonError.message,
                    rawContent: resultText.substring(0, 200) + "..." // Primeiros 200 caracteres para diagnóstico
                }, { status: 500 });
            }
        } catch (openaiError) {
            console.error('Erro na chamada da OpenAI:', openaiError);

            // Verificar tipos específicos de erro
            let errorMessage = openaiError.message;
            if (errorMessage.includes('billing') || errorMessage.includes('quota')) {
                errorMessage = "Limite da API excedido. Tente novamente mais tarde.";
            } else if (errorMessage.includes('timeout')) {
                errorMessage = "Tempo limite excedido. O servidor está ocupado, tente novamente.";
            } else if (errorMessage.includes('rate limit')) {
                errorMessage = "Muitas requisições. Aguarde alguns segundos e tente novamente.";
            }

            return NextResponse.json({
                error: 'Falha na comunicação com o serviço de IA',
                details: errorMessage
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Erro geral não tratado:', error);
        return NextResponse.json({
            error: 'Falha no processamento',
            details: error.message
        }, { status: 500 });
    }
}