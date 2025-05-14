// app/api/exame/route.js (arquivo completo otimizado para Netlify)
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Importar sharp com tratamento de erro para Netlify
let sharp;
try {
    sharp = require('sharp');
    console.log('[NETLIFY_DEBUG] Sharp importado com sucesso');
} catch (sharpError) {
    console.error('[NETLIFY_DEBUG] Erro ao importar Sharp:', sharpError);
    // Estabelecer um mock para evitar erros
    sharp = null;
}

// Configurações da rota API para Next.js 15
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';
export const maxDuration = 60; // Reduzido para 60 segundos para evitar timeouts na Netlify

// Função para extrair texto de arquivos DOCX
async function extractTextFromDOCX(buffer) {
    try {
        console.log("[NETLIFY_DEBUG] Extraindo texto de DOCX...");
        const mammoth = await import('mammoth');

        const result = await mammoth.extractRawText({
            buffer: buffer
        });

        console.log(`[NETLIFY_DEBUG] Texto extraído do DOCX: ${result.value.length} caracteres`);
        return result.value;
    } catch (error) {
        console.error("[NETLIFY_DEBUG] Erro ao extrair texto do DOCX:", error);
        throw error;
    }
}

// Função otimizada para processar imagens com OCR no ambiente Netlify
async function extractTextFromImage(buffer, fileName) {
    try {
        console.log(`[NETLIFY_IMAGE_DEBUG] Iniciando OCR para imagem: ${fileName}, tamanho: ${buffer.length} bytes`);

        // Forçar detecção de Netlify para garantir comportamento correto
        const isNetlify = true;
        console.log(`[NETLIFY_IMAGE_DEBUG] Assumindo ambiente Netlify: Sim`);

        // Verificar buffer válido
        if (!buffer || buffer.length === 0) {
            throw new Error('Buffer de imagem vazio ou inválido');
        }

        try {
            console.log('[NETLIFY_IMAGE_DEBUG] Tentando OCR com configurações para Netlify');

            // Importar tesseract.js
            const { createWorker } = await import('tesseract.js');
            console.log('[NETLIFY_IMAGE_DEBUG] Tesseract.js importado com sucesso');

            // SOLUÇÃO CRÍTICA: Configuração para evitar gravação no sistema de arquivos
            const worker = await createWorker({
                // Usar CDN remoto para modelos em vez de baixar localmente
                langPath: 'https://tessdata.projectnaptha.com/4.0.0',
                // Cache em diretório temporário
                cachePath: '/tmp/tesseract-cache',
                // Não tentar criar arquivos de log/cache
                logger: m => console.log(`[TESSERACT] ${m.status} ${m.progress.toFixed(2)}`),
                // Evitar recursos que exigem gravação
                errorHandler: e => console.error('[TESSERACT_ERROR]', e)
            });

            // Carregar idioma português diretamente da CDN
            await worker.loadLanguage('por');
            await worker.initialize('por');

            // Configurações simplificadas
            await worker.setParameters({
                tessjs_create_box: '0',
                tessjs_create_hocr: '0',
                tessjs_create_tsv: '0',
                tessjs_create_unlv: '0',
            });

            console.log('[NETLIFY_IMAGE_DEBUG] Iniciando reconhecimento de texto');
            const result = await worker.recognize(buffer);
            console.log(`[NETLIFY_IMAGE_DEBUG] OCR concluído: ${result.data.text.length} caracteres`);

            // Terminar worker explicitamente
            await worker.terminate();

            return result.data.text;
        } catch (tesseractError) {
            console.error('[NETLIFY_IMAGE_DEBUG] Erro no OCR:', tesseractError);

            // Retornar mensagem de fallback
            return "Não foi possível processar o texto desta imagem no ambiente serverless. Recomendamos converter o documento para PDF antes de enviar para melhor compatibilidade.";
        }
    } catch (error) {
        console.error('[NETLIFY_IMAGE_DEBUG] Erro crítico:', error);
        return `[ERRO DE OCR: ${error.message}] Falha ao processar imagem.`;
    }
}

// Função para OCR em ambiente Node.js - essa será nossa principal estratégia
async function extractTextWithOCR(pdfBuffer) {
    try {
        console.log("[NETLIFY_DEBUG] Iniciando OCR no PDF...");

        // Criar diretório temporário para processamento - adaptar para Netlify
        const isNetlifyEnv = process.env.NETLIFY === 'true';
        const tempRootDir = isNetlifyEnv ? '/tmp' : os.tmpdir();
        const tempDir = path.join(tempRootDir, `pdf-ocr-${Date.now()}`);

        await fs.promises.mkdir(tempDir, { recursive: true });
        const tempPdfPath = path.join(tempDir, 'temp.pdf');

        // Salvar o buffer como arquivo temporário
        await fs.promises.writeFile(tempPdfPath, pdfBuffer);
        console.log(`[NETLIFY_DEBUG] PDF temporário salvo em: ${tempPdfPath}`);

        // Importar bibliotecas necessárias
        const { createWorker } = await import('tesseract.js');
        const { PDFDocument } = await import('pdf-lib');

        // Carregar o PDF usando pdf-lib para extrair páginas
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const pageCount = pdfDoc.getPageCount();
        console.log(`[NETLIFY_DEBUG] PDF tem ${pageCount} páginas`);

        // Limitar páginas processadas na Netlify
        const maxPagesToProcess = isNetlifyEnv ? 10 : 20; // Reduzir para Netlify
        const pagesToProcess = Math.min(pageCount, maxPagesToProcess);
        console.log(`[NETLIFY_DEBUG] Processando até ${pagesToProcess} páginas`);

        // Configurar worker do Tesseract com português
        const worker = await createWorker('por');

        let fullText = '';

        // Processar cada página
        for (let i = 0; i < pagesToProcess; i++) {
            try {
                console.log(`[NETLIFY_DEBUG] Processando página ${i + 1}/${pagesToProcess}`);

                // Extrair página como PDF separado
                const subPdf = await PDFDocument.create();
                const [page] = await subPdf.copyPages(pdfDoc, [i]);
                subPdf.addPage(page);
                const pagePdfBytes = await subPdf.save();

                // Salvar página como PDF temporário
                const pagePdfPath = path.join(tempDir, `page-${i}.pdf`);
                await fs.promises.writeFile(pagePdfPath, pagePdfBytes);

                try {
                    // Verifica se estamos na Netlify - se sim, pular Puppeteer que pode não funcionar bem
                    if (isNetlifyEnv) {
                        throw new Error("Puppeteer desabilitado em ambiente Netlify");
                    }

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
                    console.log("[NETLIFY_DEBUG] Usando método alternativo para PDF:", puppeteerError.message);

                    // Método 2: Tentar converter PDF em imagem
                    try {
                        const imagePath = path.join(tempDir, `page-${i}-alt.png`);

                        if (sharp) {
                            // Tentativa com pdf-img-convert
                            try {
                                const { convert } = await import('pdf-img-convert');
                                const outputImages = await convert(pagePdfPath, {
                                    width: 1800,
                                    height: 1800
                                });

                                // Salvar primeira imagem gerada
                                if (outputImages && outputImages.length > 0) {
                                    await fs.promises.writeFile(imagePath, outputImages[0]);

                                    // Executar OCR na imagem
                                    const { data } = await worker.recognize(imagePath);
                                    fullText += data.text + '\n\n';
                                } else {
                                    throw new Error("Nenhuma imagem convertida");
                                }
                            } catch (convertError) {
                                console.error("[NETLIFY_DEBUG] Erro na conversão PDF para imagem:", convertError);

                                // Método 3: Último recurso - extrair texto diretamente com pdf.js
                                try {
                                    const { getDocument } = await import('pdfjs-dist');

                                    const loadingTask = getDocument({ data: pagePdfBytes });
                                    const pdf = await loadingTask.promise;
                                    const page = await pdf.getPage(1);
                                    const textContent = await page.getTextContent();
                                    const pageText = textContent.items.map(item => item.str).join(' ');

                                    fullText += pageText + '\n\n';
                                } catch (pdfJsError) {
                                    console.error("[NETLIFY_DEBUG] Falha na extração direta:", pdfJsError);
                                }
                            }
                        } else {
                            // Sem sharp, usar apenas pdf.js
                            try {
                                const { getDocument } = await import('pdfjs-dist');

                                const loadingTask = getDocument({ data: pagePdfBytes });
                                const pdf = await loadingTask.promise;
                                const page = await pdf.getPage(1);
                                const textContent = await page.getTextContent();
                                const pageText = textContent.items.map(item => item.str).join(' ');

                                fullText += pageText + '\n\n';
                            } catch (pdfJsError) {
                                console.error("[NETLIFY_DEBUG] Falha na extração PDF:", pdfJsError);
                            }
                        }
                    } catch (allMethodsError) {
                        console.error("[NETLIFY_DEBUG] Todos os métodos de extração PDF falharam:", allMethodsError);
                    }
                }
            } catch (pageError) {
                console.error(`[NETLIFY_DEBUG] Erro ao processar página ${i + 1}:`, pageError);
            }
        }

        // Limpar recursos
        await worker.terminate();
        console.log("[NETLIFY_DEBUG] Worker Tesseract finalizado");

        // Limpar arquivos temporários
        try {
            const files = await fs.promises.readdir(tempDir);
            for (const file of files) {
                await fs.promises.unlink(path.join(tempDir, file));
            }
            await fs.promises.rmdir(tempDir);
            console.log("[NETLIFY_DEBUG] Arquivos temporários removidos");
        } catch (cleanupError) {
            console.error("[NETLIFY_DEBUG] Erro ao limpar arquivos temporários:", cleanupError);
        }

        return fullText;
    } catch (error) {
        console.error('[NETLIFY_DEBUG] Erro no OCR do PDF:', error);
        throw new Error(`Falha ao extrair texto do PDF: ${error.message}`);
    }
}

// Função alternativa para tentar extrair texto diretamente do PDF
async function extractTextWithPdfJS(pdfBuffer) {
    try {
        console.log("[NETLIFY_DEBUG] Tentando extrair texto com pdf.js...");

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
        console.error('[NETLIFY_DEBUG] Erro ao extrair texto com pdf.js:', error);
        throw error;
    }
}

// Processar texto para extrair informações do paciente
async function processPatientInfoWithAI(text) {
    try {
        // Truncar o texto se for muito longo
        const maxLength = 15000;
        const truncatedText = text.length > maxLength
            ? text.substring(0, maxLength) + "... [texto truncado devido ao tamanho]"
            : text;

        console.log(`[NETLIFY_DEBUG] Processando texto com OpenAI para extrair dados do paciente: ${truncatedText.length} caracteres`);

        // Verificar se a chave da API está configurada
        if (!process.env.OPENAI_KEY) {
            console.error('[NETLIFY_DEBUG] OPENAI_KEY não configurada');
            throw new Error('Configuração da API de IA não encontrada');
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_KEY
        });

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Você é um assistente especializado em extrair informações de pacientes de documentos médicos."
                },
                {
                    role: "user",
                    content: `
                        Analise o texto a seguir e extraia informações básicas do paciente em formato JSON.
                        Extraia APENAS as seguintes informações (somente se estiverem presentes no texto):
                        
                        - nome (nome completo do paciente)
                        - email (endereço de e-mail do paciente)
                        - telefone (número de telefone, formate como (00) 00000-0000)
                        - tipoSanguineo (deve ser um dos seguintes: A+, A-, B+, B-, AB+, AB-, O+, O-)
                        - genero (deve ser "masculino" ou "feminino")
                        - dataNascimento (data de nascimento no formato DD/MM/AAAA)
                        - endereco (endereço completo)
                        - cpf (CPF do paciente, formate como 000.000.000-00)
                        - cidade (cidade do paciente)
                        - estado (estado do paciente, use sigla de 2 letras: SP, RJ, etc.)
                        - cep (CEP, formate como 00000-000)
                        
                        Se alguma informação não estiver presente no texto, NÃO inclua o campo no JSON.
                        Nunca invente ou preencha informações que não estejam explicitamente presentes no documento.
                        Se encontrar informações com nomes diferentes, mas que correspondam claramente a esses campos, faça o mapeamento correto.
                        
                        Texto do documento:
                        ${truncatedText}
                    `
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2
        });

        // Extrair e validar o JSON retornado
        const resultText = response.choices[0].message.content;
        return JSON.parse(resultText);
    } catch (error) {
        console.error('[NETLIFY_DEBUG] Erro ao processar texto com OpenAI:', error);
        throw error;
    }
}

// Função para processar texto extraído com OpenAI e estruturar resultados dos exames
async function processTextWithOpenAI(text) {
    try {
        // Truncar o texto se for muito longo
        const maxLength = 15000;
        const truncatedText = text.length > maxLength
            ? text.substring(0, maxLength) + "... [texto truncado devido ao tamanho]"
            : text;

        console.log(`[NETLIFY_DEBUG] Processando texto com OpenAI: ${truncatedText.length} caracteres`);

        // Verificar se a chave da API está configurada
        if (!process.env.OPENAI_KEY) {
            console.error('[NETLIFY_DEBUG] OPENAI_KEY não configurada');
            throw new Error('Configuração da API de IA não encontrada');
        }

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

        // Extrair e validar o JSON retornado
        const resultText = response.choices[0].message.content;
        return JSON.parse(resultText);
    } catch (error) {
        console.error('[NETLIFY_DEBUG] Erro ao processar texto com OpenAI:', error);
        throw error;
    }
}

export async function POST(req) {
    try {
        let text = "";
        let sourceType = "unknown";
        let fileName = "";
        let fileType = "";
        let extractType = "exam"; // Default é extração de exames médicos

        console.log('[NETLIFY_DEBUG] Iniciando processamento de requisição');
        const startTime = Date.now();

        // Detectar ambiente Netlify
        const isNetlifyEnv = process.env.NETLIFY === 'true' ||
            process.env.CONTEXT === 'production' ||
            process.env.CONTEXT === 'deploy-preview';
        console.log(`[NETLIFY_DEBUG] Ambiente Netlify detectado: ${isNetlifyEnv ? 'Sim' : 'Não'}`);

        // Tentar processar como FormData (upload de arquivo)
        try {
            console.log('[NETLIFY_DEBUG] Tentando processar como FormData');
            const formData = await req.formData();
            const file = formData.get('file');

            // Verificar se há um parâmetro de tipo de extração
            if (formData.get('extractType')) {
                extractType = formData.get('extractType');
                console.log(`[NETLIFY_DEBUG] Tipo de extração solicitada: ${extractType}`);
            }

            if (file) {
                sourceType = "file-upload";
                fileName = file.name || "arquivo";
                fileType = file.type || "";

                console.log(`[NETLIFY_DEBUG] Processando arquivo: ${fileName}, tipo: ${fileType}, tamanho: ${file.size} bytes`);

                // Definir limite de tamanho máximo
                const MAX_FILE_SIZE = isNetlifyEnv ? 10 * 1024 * 1024 : 15 * 1024 * 1024; // 10MB na Netlify
                if (file.size > MAX_FILE_SIZE) {
                    return NextResponse.json({
                        error: 'Arquivo muito grande',
                        details: `O tamanho máximo permitido é ${isNetlifyEnv ? '10MB' : '15MB'}`
                    }, { status: 400 });
                }

                // Converter para Buffer
                console.log('[NETLIFY_DEBUG] Convertendo arquivo para buffer');
                const buffer = Buffer.from(await file.arrayBuffer());

                // Verificar tipo de arquivo e processar adequadamente
                const isDocx = fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                    fileName.toLowerCase().endsWith('.docx');

                const isPdf = fileType === 'application/pdf' ||
                    fileName.toLowerCase().endsWith('.pdf');

                const isImage = fileType.startsWith('image/') ||
                    fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/);

                if (isDocx) {
                    // Processar DOCX
                    try {
                        console.log('[NETLIFY_DEBUG] Processando arquivo DOCX');
                        text = await extractTextFromDOCX(buffer);
                        console.log(`[NETLIFY_DEBUG] Texto extraído do DOCX: ${text.length} caracteres`);
                    } catch (docxError) {
                        console.error("[NETLIFY_DEBUG] Erro ao processar DOCX:", docxError);
                        return NextResponse.json({
                            error: 'Falha ao processar o arquivo DOCX',
                            details: docxError.message
                        }, { status: 500 });
                    }
                } else if (isPdf) {
                    // Estratégia 1: Tentar extrair com pdf.js
                    try {
                        console.log('[NETLIFY_DEBUG] Tentando extrair texto do PDF com pdf.js');
                        text = await extractTextWithPdfJS(buffer);
                        console.log(`[NETLIFY_DEBUG] Texto extraído com pdf.js: ${text.length} caracteres`);

                        // Verificar se extraiu texto suficiente
                        if (!text.trim() || text.length < 100) {
                            console.log("[NETLIFY_DEBUG] Texto insuficiente extraído com pdf.js, tentando OCR...");
                            text = await extractTextWithOCR(buffer);
                        }
                    } catch (pdfJSError) {
                        console.error("[NETLIFY_DEBUG] Erro ao extrair texto com pdf.js:", pdfJSError);

                        // Estratégia 2: Ir direto para OCR como fallback
                        console.log("[NETLIFY_DEBUG] Tentando extração com OCR...");
                        text = await extractTextWithOCR(buffer);
                    }
                } else if (isImage) {
                    // Processar imagem com OCR otimizado para Netlify
                    try {
                        console.log(`[NETLIFY_DEBUG] Iniciando processamento de imagem: ${fileName}`);
                        text = await extractTextFromImage(buffer, fileName);

                        // Verificar se o texto começa com indicador de erro
                        if (text.startsWith('[ERRO DE OCR')) {
                            console.error(`[NETLIFY_DEBUG] OCR falhou: ${text}`);

                            // Tentar outro método como fallback - diretamente com tesseract
                            try {
                                console.log('[NETLIFY_DEBUG] Tentando método OCR alternativo');
                                const { createWorker } = await import('tesseract.js');
                                const worker = await createWorker();
                                await worker.loadLanguage('por');
                                await worker.initialize('por');

                                // Usar o buffer diretamente
                                const result = await worker.recognize(buffer);
                                text = result.data.text;
                                await worker.terminate();

                                console.log(`[NETLIFY_DEBUG] OCR alternativo extraiu ${text.length} caracteres`);
                            } catch (fallbackError) {
                                console.error('[NETLIFY_DEBUG] Erro no OCR alternativo:', fallbackError);
                                return NextResponse.json({
                                    error: 'Falha no processamento da imagem',
                                    details: 'Não foi possível extrair texto da imagem após múltiplas tentativas',
                                    errorType: 'ocr_failure'
                                }, { status: 500 });
                            }
                        }

                        console.log(`[NETLIFY_DEBUG] Texto extraído da imagem: ${text.length} caracteres`);

                        // Verificar se o texto extraído é suficiente
                        if (!text || text.trim().length < 30) {
                            console.warn('[NETLIFY_DEBUG] Texto extraído insuficiente');
                            return NextResponse.json({
                                warning: 'Texto extraído insuficiente',
                                textLength: text ? text.length : 0,
                                sampleText: text ? text.substring(0, 200) : '',
                                suggestion: 'Tente uma imagem com melhor qualidade ou um arquivo PDF'
                            }, { status: 200 });
                        }
                    } catch (imageError) {
                        console.error("[NETLIFY_DEBUG] Erro crítico no processamento de imagem:", imageError);
                        return NextResponse.json({
                            error: 'Falha no processamento da imagem',
                            details: imageError.message,
                            suggestion: 'Tente novamente com uma imagem de melhor qualidade ou com um arquivo PDF'
                        }, { status: 500 });
                    }
                } else {
                    return NextResponse.json({
                        error: 'Tipo de arquivo não suportado',
                        details: 'Por favor, envie arquivos nos formatos PDF, DOCX ou imagens (JPG, JPEG, PNG, GIF)'
                    }, { status: 400 });
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
                console.log('[NETLIFY_DEBUG] Tentando processar como JSON');
                const body = await req.json();
                sourceType = "json";

                if (body.url) {
                    sourceType = "remote-url";
                    console.log(`[NETLIFY_DEBUG] Processando URL: ${body.url}`);

                    try {
                        const response = await fetch(body.url);
                        if (!response.ok) {
                            throw new Error(`Falha ao baixar o arquivo: ${response.status} ${response.statusText}`);
                        }

                        // Tentar determinar o tipo de arquivo da URL
                        const contentType = response.headers.get('content-type') || '';
                        const urlPath = new URL(body.url).pathname.toLowerCase();

                        // Obter o conteúdo binário
                        const fileBuffer = await response.arrayBuffer();
                        const buffer = Buffer.from(fileBuffer);

                        const isDocx = contentType.includes('openxmlformats-officedocument') || urlPath.endsWith('.docx');
                        const isPdf = contentType.includes('application/pdf') || urlPath.endsWith('.pdf');
                        const isImage = contentType.startsWith('image/') ||
                            urlPath.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/);

                        if (isDocx) {
                            text = await extractTextFromDOCX(buffer);
                        } else if (isPdf) {
                            // Processar com os mesmos métodos de PDF
                            try {
                                text = await extractTextWithPdfJS(buffer);
                                if (!text.trim() || text.length < 100) {
                                    text = await extractTextWithOCR(buffer);
                                }
                            } catch (urlPdfError) {
                                console.error("[NETLIFY_DEBUG] Erro na extração primária:", urlPdfError);
                                text = await extractTextWithOCR(buffer);
                            }
                        } else if (isImage) {
                            // Extrair texto da imagem com OCR
                            const fileName = urlPath.split('/').pop() || 'image.jpg';
                            text = await extractTextFromImage(buffer, fileName);
                        } else {
                            throw new Error('Tipo de arquivo não suportado da URL. Use PDF, DOCX ou imagens.');
                        }

                        console.log(`[NETLIFY_DEBUG] Texto extraído da URL: ${text.length} caracteres`);
                    } catch (urlError) {
                        console.error("[NETLIFY_DEBUG] Erro ao processar URL:", urlError);
                        return NextResponse.json({
                            error: 'Falha ao processar o arquivo da URL',
                            details: urlError.message
                        }, { status: 500 });
                    }
                } else if (body.text) {
                    sourceType = "direct-text";
                    text = body.text;
                    console.log(`[NETLIFY_DEBUG] Texto fornecido diretamente: ${text.length} caracteres`);

                    // Verificar tipo de extração no body
                    if (body.extractType) {
                        extractType = body.extractType;
                        console.log(`[NETLIFY_DEBUG] Tipo de extração solicitada no JSON: ${extractType}`);
                    }
                } else {
                    return NextResponse.json({
                        error: 'Corpo da requisição inválido',
                        details: 'Esperava um objeto com "text" ou "url"'
                    }, { status: 400 });
                }
            } catch (jsonError) {
                console.error("[NETLIFY_DEBUG] Erro ao processar corpo da requisição:", jsonError);
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
                details: 'Não foi possível extrair texto do arquivo mesmo com OCR'
            }, { status: 400 });
        }

        // Processar o texto extraído com OpenAI
        try {
            let jsonResult;

            // Escolher o processamento adequado conforme o tipo solicitado
            if (extractType === 'patientInfo') {
                // Processar para informações de paciente
                console.log('[NETLIFY_DEBUG] Processando informações do paciente');
                jsonResult = await processPatientInfoWithAI(text);

                // Verificar se conseguiu extrair alguns dados do paciente
                const fieldCount = Object.keys(jsonResult).length;
                console.log(`[NETLIFY_DEBUG] Campos de paciente encontrados: ${fieldCount}`);

                if (fieldCount === 0) {
                    return NextResponse.json({
                        success: true,
                        data: {},
                        warning: "Nenhuma informação de paciente identificada no texto fornecido",
                        rawText: text.substring(0, 500) + "..." // Primeiros 500 caracteres para diagnóstico
                    });
                }
            } else {
                // Processamento padrão para exames
                console.log('[NETLIFY_DEBUG] Processando resultados de exames');
                jsonResult = await processTextWithOpenAI(text);

                // Verificar se há pelo menos alguma categoria de exame
                const categoryCount = Object.keys(jsonResult).length;
                console.log(`[NETLIFY_DEBUG] Categorias encontradas: ${categoryCount}`);

                if (categoryCount === 0) {
                    return NextResponse.json({
                        success: true,
                        data: {},
                        warning: "Nenhum resultado de exame identificado no texto fornecido",
                        rawText: text.substring(0, 500) + "..." // Primeiros 500 caracteres para diagnóstico
                    });
                }
            }

            // Calcular tempo total de processamento
            const processingTime = (Date.now() - startTime) / 1000;
            console.log(`[NETLIFY_DEBUG] Processamento completo em ${processingTime.toFixed(2)}s`);

            return NextResponse.json({
                success: true,
                data: jsonResult,
                source: sourceType,
                fileType: fileType,
                fileName: fileName,
                textLength: text.length,
                processingTimeSeconds: processingTime.toFixed(2)
            });

        } catch (processingError) {
            console.error("[NETLIFY_DEBUG] Erro ao processar texto com OpenAI:", processingError);

            return NextResponse.json({
                error: "Falha ao processar o texto extraído",
                details: processingError.message,
                textSample: text.substring(0, 300) + "..." // Amostra para diagnóstico
            }, { status: 500 });
        }

    } catch (error) {
        console.error('[NETLIFY_DEBUG] Erro geral não tratado:', error);
        return NextResponse.json({
            error: 'Falha no processamento',
            details: error.message
        }, { status: 500 });
    }
}