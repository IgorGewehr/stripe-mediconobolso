import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Declare a rota como dinâmica para o Netlify
export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        let text = "";
        let sourceType = "unknown";

        // 1. Tentar processar como FormData (upload de arquivo)
        try {
            const formData = await req.formData();
            const file = formData.get('file');

            if (file) {
                sourceType = "file-upload";
                console.log(`Processando arquivo: ${file.name}, tipo: ${file.type}, tamanho: ${file.size} bytes`);

                try {
                    // Importação dinâmica do pdf-parse
                    const pdfParseModule = await import('pdf-parse');
                    const pdfParse = pdfParseModule.default;

                    // Converter para Buffer
                    const buffer = Buffer.from(await file.arrayBuffer());

                    // CORREÇÃO IMPORTANTE: Definir opções para evitar o erro de "test/data"
                    const options = {
                        // Evitar carregar arquivos de teste internos
                        pagerender: null,
                        max: 0, // Sem limite de páginas
                        version: 'v2.0.550' // Especificar versão
                    };

                    console.log("Iniciando extração de texto do PDF...");
                    const data = await pdfParse(buffer, options);
                    text = data.text || "";
                    console.log(`Texto extraído com sucesso: ${text.length} caracteres`);

                    if (!text.trim()) {
                        throw new Error("O PDF não contém texto extraível");
                    }
                } catch (pdfError) {
                    console.error('Erro detalhado ao processar PDF:', pdfError);

                    // Tentar determinar o tipo de erro para mensagem mais útil
                    let errorMessage = pdfError.message;
                    if (errorMessage.includes('no such file or directory')) {
                        errorMessage = "Erro interno no processador de PDF. Use um PDF com texto extraível.";
                    } else if (errorMessage.includes('encrypted')) {
                        errorMessage = "O PDF está protegido/criptografado e não pode ser processado.";
                    }

                    return NextResponse.json({
                        error: 'Falha ao processar o arquivo PDF',
                        details: errorMessage
                    }, { status: 500 });
                }
            } else {
                return NextResponse.json({
                    error: 'Arquivo não fornecido no FormData',
                    details: 'Verifique se o campo "file" está presente no formulário'
                }, { status: 400 });
            }
        } catch (formDataError) {
            // Não é FormData, vamos tentar como JSON
            console.log("Formato não é FormData, tentando JSON...");

            try {
                // 2. Tentar processar como JSON (texto ou URL)
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
                details: 'O PDF pode estar protegido ou não conter texto extraível'
            }, { status: 400 });
        }

        // Truncar o texto se for muito longo
        const maxLength = 15000; // Limite para a OpenAI
        const truncatedText = text.length > maxLength
            ? text.substring(0, maxLength) + "... [texto truncado devido ao tamanho]"
            : text;

        console.log(`Texto para processamento (${sourceType}): ${truncatedText.length} caracteres`);

        // Prompt para processamento com a OpenAI
        const prompt = `
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
        `;

        // Verificar se a chave da API está configurada
        if (!process.env.OPENAI_KEY) {
            console.error('OPENAI_KEY não configurada');
            return NextResponse.json({
                error: 'Configuração da API de IA não encontrada',
                details: 'A variável de ambiente OPENAI_KEY não está configurada'
            }, { status: 500 });
        }

        try {
            console.log("Iniciando processamento com OpenAI...");

            // Chamada à API da OpenAI
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
                        content: prompt
                    }
                ],
                response_format: { type: "json_object" },
                temperature: 0.2 // Baixa temperatura para respostas mais consistentes
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
                        warning: "Nenhum resultado de exame identificado no texto fornecido"
                    });
                }

                return NextResponse.json({
                    success: true,
                    data: jsonResult,
                    source: sourceType
                });
            } catch (jsonError) {
                console.error("Erro ao converter resposta para JSON:", jsonError, resultText);
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