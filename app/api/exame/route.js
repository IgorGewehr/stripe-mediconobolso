import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Declare a rota como dinâmica para o Netlify
export const dynamic = 'force-dynamic';

// Função para OCR em ambiente Node.js - essa será nossa principal estratégia
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

        // Carregar o PDF usando pdf-lib para extrair páginas
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pageCount = pdfDoc.getPageCount();
        console.log(`PDF tem ${pageCount} páginas`);

        // Configurar worker do Tesseract com português
        const worker = await createWorker('por');

        let fullText = '';

        // Processar cada página
        for (let i = 0; i < Math.min(pageCount, 20); i++) { // Limite de 20 páginas para evitar processamento muito longo
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

                try {
                    // Método 1: Tentar usar puppeteer (mais confiável para renderizar PDFs)
                    const { default: puppeteer } = await import('puppeteer');
                    const browser = await puppeteer.launch({
                        headless: 'new',
                        args: ['--no-sandbox', '--disable-setuid-sandbox']
                    });
                    const page = await browser.newPage();

                    // Configurar viewport com alta resolução
                    await page.setViewport({
                        width: 1200,
                        height: 1600,
                        deviceScaleFactor: 2
                    });

                    // Carregar o PDF como data URL
                    const pdfBase64 = pagePdfBytes.toString('base64');
                    const dataUrl = `data:application/pdf;base64,${pdfBase64}`;
                    await page.goto(dataUrl, { waitUntil: 'networkidle0' });

                    // Capturar screenshot com alta resolução
                    const imagePath = path.join(tempDir, `page-${i}.png`);
                    await page.screenshot({
                        path: imagePath,
                        fullPage: true,
                        quality: 100
                    });
                    await browser.close();

                    // Executar OCR na imagem capturada
                    const { data } = await worker.recognize(imagePath);
                    fullText += data.text + '\n\n';
                } catch (puppeteerError) {
                    console.error("Erro no método primário:", puppeteerError);

                    // Método 2: Usar módulo sharp como fallback
                    try {
                        const imagePath = path.join(tempDir, `page-${i}-alt.png`);

                        // Tentativa direta com pdf-img-convert
                        try {
                            const { convert } = await import('pdf-img-convert');
                            const outputImages = await convert(pagePdfPath, {
                                width: 2000,
                                height: 2000
                            });

                            // Salvar primeira imagem gerada
                            if (outputImages && outputImages.length > 0) {
                                await fs.promises.writeFile(imagePath, outputImages[0]);

                                // Executar OCR na imagem
                                const { data } = await worker.recognize(imagePath);
                                fullText += data.text + '\n\n';
                            }
                        } catch (convertError) {
                            console.error("Erro na conversão alternativa:", convertError);

                            // Se falhar, tentar com poppler/pdftoppm se disponível através de Node
                            try {
                                const { execSync } = await import('child_process');
                                execSync(`pdftoppm -png -r 300 "${pagePdfPath}" "${path.join(tempDir, 'page-pdftoppm')}"`,
                                    { stdio: 'pipe' });

                                // Verificar se gerou o arquivo
                                const popplerFilePath = path.join(tempDir, 'page-pdftoppm-1.png');
                                if (fs.existsSync(popplerFilePath)) {
                                    const { data } = await worker.recognize(popplerFilePath);
                                    fullText += data.text + '\n\n';
                                }
                            } catch (popplerError) {
                                console.error("Todas as alternativas de conversão falharam");
                            }
                        }
                    } catch (allMethodsError) {
                        console.error("Todos os métodos de conversão falharam:", allMethodsError);
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

// Função alternativa para tentar extrair texto diretamente do PDF
async function extractTextWithPdfJS(pdfBuffer) {
    try {
        console.log("Tentando extrair texto com pdf.js...");

        // Usar o pdf.js em vez de pdf-parse
        const { getDocument } = await import('pdfjs-dist');

        // Configurar worker para pdf.js
        const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.js');
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

        // Carregar o PDF
        const loadingTask = getDocument({ data: new Uint8Array(pdfBuffer) });
        const pdf = await loadingTask.promise;

        let fullText = '';

        // Extrair texto de cada página
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const strings = content.items.map(item => item.str);
            fullText += strings.join(' ') + '\n\n';
        }

        return fullText;
    } catch (error) {
        console.error('Erro ao extrair texto com pdf.js:', error);
        throw error;
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

                // Definir limite de tamanho máximo
                const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
                if (file.size > MAX_FILE_SIZE) {
                    return NextResponse.json({
                        error: 'Arquivo muito grande',
                        details: 'O tamanho máximo permitido é 15MB'
                    }, { status: 400 });
                }

                // Converter para Buffer
                const buffer = Buffer.from(await file.arrayBuffer());

                try {
                    // Estratégia 1: Tentar extrair com pdf.js
                    try {
                        text = await extractTextWithPdfJS(buffer);
                        console.log(`Texto extraído com pdf.js: ${text.length} caracteres`);

                        // Verificar se extraiu texto suficiente
                        if (!text.trim() || text.length < 100) {
                            console.log("Texto insuficiente extraído com pdf.js, tentando OCR...");
                            text = await extractTextWithOCR(buffer);
                        }
                    } catch (pdfJSError) {
                        console.error("Erro ao extrair texto com pdf.js:", pdfJSError);

                        // Estratégia 2: Ir direto para OCR como fallback
                        console.log("Tentando extração com OCR...");
                        text = await extractTextWithOCR(buffer);
                    }

                    if (!text.trim()) {
                        throw new Error("Nenhum método conseguiu extrair texto suficiente");
                    }

                    console.log(`Texto extraído com sucesso: ${text.length} caracteres`);
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

                        // Processar com os mesmos métodos
                        try {
                            text = await extractTextWithPdfJS(buffer);
                            if (!text.trim() || text.length < 100) {
                                text = await extractTextWithOCR(buffer);
                            }
                        } catch (urlPdfError) {
                            console.error("Erro na extração primária:", urlPdfError);
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