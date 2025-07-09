// app/api/audio-processing/route.js
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import * as path from 'path';

// Configurações da rota API para Next.js 15
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';
export const maxDuration = 600; // 10 minutos para processamento de audio longo (anamnese)

// Prompt especializado para análise médica de áudio
const MEDICAL_AUDIO_SYSTEM_PROMPT = `Você é um assistente médico especializado em transcrição e análise de áudio médico.

DIRETRIZES PARA ANÁLISE:
- Processe transcrições de consultas médicas, ditados médicos, ou gravações de pacientes
- Organize as informações em formato estruturado e claro
- Identifique sintomas, diagnósticos, medicamentos e recomendações
- Mantenha terminologia médica precisa
- Destaque informações críticas que requerem atenção médica

FORMATO DE RESPOSTA:
- Estruture em seções: Resumo, Sintomas, Diagnóstico, Tratamento, Observações
- Use linguagem médica apropriada
- Inclua alertas para informações urgentes
- Mantenha confidencialidade médica

IMPORTANTE: Este é um auxílio para profissionais médicos. Todas as informações devem ser validadas por um médico qualificado.`;

// Função para processar áudio com OpenAI Whisper
async function transcribeAudio(audioBuffer, originalFilename, audioContentType = 'audio/mpeg') {
    try {
        console.log(`[AUDIO_API] Iniciando transcrição de áudio: ${originalFilename}`);
        
        // Verificar se a chave da API está configurada
        if (!process.env.OPENAI_KEY) {
            console.error('[AUDIO_API] OPENAI_KEY não configurada');
            throw new Error('Configuração da API de IA não encontrada');
        }

        // Criar cliente OpenAI
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_KEY
        });

        // Verificar tamanho do arquivo (limite OpenAI: 25MB)
        const fileSizeInMB = audioBuffer.length / (1024 * 1024);
        console.log(`[AUDIO_API] Tamanho do arquivo: ${fileSizeInMB.toFixed(2)}MB`);

        if (fileSizeInMB > 25) {
            throw new Error('Arquivo de áudio muito grande. O limite máximo é 25MB.');
        }

        // Determinar extensão do arquivo baseada no tipo
        const fileExtension = path.extname(originalFilename).toLowerCase() || '.mp3';
        
        // Criar um Blob a partir do buffer de áudio
        const audioBlob = new Blob([audioBuffer], { type: audioContentType });
        
        // Criar um objeto File a partir do Blob
        const audioFile = new File([audioBlob], `audio${fileExtension}`, { type: audioContentType });

        // Transcrever áudio usando Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
            language: "pt", // Português
            response_format: "json",
            temperature: 0.2 // Baixa temperatura para maior precisão
        });

        console.log(`[AUDIO_API] Transcrição concluída: ${transcription.text.length} caracteres`);
        return transcription.text;

    } catch (error) {
        console.error('[AUDIO_API] Erro na transcrição:', error);
        throw error;
    }
}

// Função para análise médica do texto transcrito
async function analyzeMedicalContent(transcription, analysisType = 'general') {
    try {
        console.log(`[AUDIO_API] Iniciando análise médica: ${analysisType}`);
        
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_KEY
        });

        // Definir prompt específico baseado no tipo de análise
        let analysisPrompt = '';
        
        switch (analysisType) {
            case 'consultation':
                analysisPrompt = `
                    Analise esta transcrição de consulta médica e organize as informações em formato estruturado:
                    
                    FORMATO ESPERADO:
                    {
                        "resumo": "Resumo da consulta",
                        "queixaPrincipal": "Queixa principal do paciente",
                        "sintomas": ["lista de sintomas identificados"],
                        "exameFisico": "Achados do exame físico",
                        "diagnostico": "Diagnóstico ou hipótese diagnóstica",
                        "tratamento": "Plano de tratamento proposto",
                        "medicamentos": ["lista de medicamentos prescritos"],
                        "orientacoes": ["orientações dadas ao paciente"],
                        "retorno": "Informações sobre retorno/seguimento",
                        "observacoes": "Observações adicionais importantes"
                    }
                `;
                break;
            
            case 'anamnese':
                analysisPrompt = `
                    Analise esta transcrição de anamnese médica e extraia TODAS as informações relevantes para preencher uma ficha de anamnese completa.
                    
                    FORMATO ESPERADO (preencha todos os campos possíveis com base na transcrição):
                    {
                        "queixaPrincipal": "Motivo principal da consulta",
                        "historiaDoencaAtual": "História detalhada da doença atual",
                        "historiaPatologicaPregressa": ["doenças prévias", "cirurgias", "internações"],
                        "historicoFamiliar": "Doenças hereditárias ou familiares",
                        "habitosDeVida": {
                            "tabagismo": "Se fuma, quantos cigarros por dia, há quanto tempo",
                            "alcoolismo": "Se consome álcool, frequência e quantidade",
                            "drogas": "Uso de drogas ilícitas",
                            "atividadeFisica": "Prática de exercícios físicos",
                            "alimentacao": "Hábitos alimentares",
                            "ocupacao": "Profissão e ambiente de trabalho"
                        },
                        "medicamentosEmUso": ["lista de medicamentos atuais com dosagens"],
                        "alergias": ["alergias medicamentosas", "alergias alimentares", "outras alergias"],
                        "revisaoDeSistemas": {
                            "cardiovascular": "Sintomas cardiovasculares",
                            "respiratorio": "Sintomas respiratórios",
                            "gastrointestinal": "Sintomas gastrointestinais",
                            "genitourinario": "Sintomas genitourinários",
                            "neurologico": "Sintomas neurológicos",
                            "musculoesqueletico": "Sintomas musculoesqueléticos",
                            "endocrino": "Sintomas endócrinos",
                            "hematologico": "Sintomas hematológicos",
                            "psiquiatrico": "Sintomas psiquiátricos",
                            "dermatologico": "Sintomas dermatológicos"
                        },
                        "exameFisico": {
                            "aspectoGeral": "Aparência geral do paciente",
                            "sinaisVitais": {
                                "pressaoArterial": "PA em mmHg",
                                "frequenciaCardiaca": "FC em bpm",
                                "temperatura": "Temperatura em °C",
                                "frequenciaRespiratoria": "FR em rpm",
                                "saturacaoO2": "SpO2 em %"
                            },
                            "cabecaPescoco": "Achados do exame de cabeça e pescoço",
                            "cardiovascular": "Achados do exame cardiovascular",
                            "respiratorio": "Achados do exame respiratório",
                            "abdome": "Achados do exame abdominal",
                            "extremidades": "Achados do exame de extremidades",
                            "neurologico": "Achados do exame neurológico"
                        },
                        "hipoteseDiagnostica": "Hipóteses diagnósticas",
                        "planoTerapeutico": "Plano de tratamento proposto",
                        "observacoesAdicionais": "Outras informações relevantes"
                    }
                    
                    IMPORTANTE: 
                    - Extraia o máximo de informações possível da transcrição
                    - Se alguma informação não estiver disponível, use null
                    - Mantenha a linguagem médica apropriada
                    - Seja detalhado e completo em cada campo
                `;
                break;
            
            case 'dictation':
                analysisPrompt = `
                    Analise este ditado médico e extraia as informações clínicas relevantes:
                    
                    FORMATO ESPERADO:
                    {
                        "tipoDocumento": "Tipo de documento (receita, relatório, etc.)",
                        "informacoesClinicas": "Informações clínicas principais",
                        "medicamentos": ["medicamentos mencionados"],
                        "dosagens": ["dosagens e posologias"],
                        "procedimentos": ["procedimentos mencionados"],
                        "observacoes": "Observações e recomendações"
                    }
                `;
                break;
            
            case 'symptoms':
                analysisPrompt = `
                    Analise esta descrição de sintomas e organize as informações:
                    
                    FORMATO ESPERADO:
                    {
                        "sintomasPrincipais": ["sintomas principais relatados"],
                        "cronologia": "Cronologia dos sintomas",
                        "intensidade": "Intensidade dos sintomas",
                        "fatoresAgravantes": ["fatores que pioram os sintomas"],
                        "fatoresAliviantes": ["fatores que aliviam os sintomas"],
                        "sintomasAssociados": ["outros sintomas relacionados"],
                        "sugestoes": ["sugestões para investigação médica"]
                    }
                `;
                break;
            
            default:
                analysisPrompt = `
                    Analise este conteúdo médico e organize as informações de forma estruturada:
                    
                    FORMATO ESPERADO:
                    {
                        "resumo": "Resumo do conteúdo",
                        "informacoesClinicas": "Principais informações clínicas",
                        "pontosImportantes": ["pontos importantes identificados"],
                        "recomendacoes": ["recomendações ou próximos passos"],
                        "observacoes": "Observações adicionais"
                    }
                `;
        }

        // Use o modelo mais poderoso para anamnese devido à complexidade
        const modelToUse = analysisType === 'anamnese' ? "gpt-4o" : "gpt-4";
        const maxTokensToUse = analysisType === 'anamnese' ? 4000 : 2000;
        
        const response = await openai.chat.completions.create({
            model: modelToUse,
            messages: [
                {
                    role: "system",
                    content: MEDICAL_AUDIO_SYSTEM_PROMPT
                },
                {
                    role: "user",
                    content: `
                        ${analysisPrompt}
                        
                        Transcrição para análise:
                        ${transcription}
                        
                        Retorne o resultado em formato JSON válido.
                    `
                }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
            max_tokens: maxTokensToUse
        });

        const analysisResult = JSON.parse(response.choices[0].message.content);
        console.log('[AUDIO_API] Análise médica concluída');
        
        return analysisResult;

    } catch (error) {
        console.error('[AUDIO_API] Erro na análise médica:', error);
        throw error;
    }
}

// Função para validar tipos de arquivo de áudio suportados
function isValidAudioFile(filename, mimetype) {
    const supportedExtensions = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'];
    const supportedMimeTypes = [
        'audio/mpeg',
        'audio/mp4',
        'audio/wav',
        'audio/webm',
        'audio/x-m4a',
        'audio/mp3'
    ];
    
    const extension = path.extname(filename).toLowerCase();
    const hasValidExtension = supportedExtensions.includes(extension);
    const hasValidMimeType = supportedMimeTypes.some(type => mimetype.includes(type));
    
    return hasValidExtension || hasValidMimeType;
}

export async function POST(req) {
    try {
        console.log('[AUDIO_API] Iniciando processamento de requisição de áudio');
        
        let audioBuffer;
        let originalFilename = '';
        let analysisType = 'general';
        let transcriptionOnly = false;
        let mimetype = 'audio/mpeg';

        // Processar FormData (upload de arquivo)
        try {
            const formData = await req.formData();
            const audioFile = formData.get('audio');
            
            // Verificar parâmetros opcionais
            if (formData.get('analysisType')) {
                analysisType = formData.get('analysisType');
            }
            
            if (formData.get('transcriptionOnly')) {
                transcriptionOnly = formData.get('transcriptionOnly') === 'true';
            }

            if (!audioFile) {
                return NextResponse.json({
                    success: false,
                    error: 'Arquivo de áudio não fornecido',
                    details: 'Verifique se o campo "audio" está presente no formulário'
                }, { status: 400 });
            }

            originalFilename = audioFile.name || 'audio.mp3';
            mimetype = audioFile.type || 'audio/mpeg';

            console.log(`[AUDIO_API] Processando arquivo: ${originalFilename}, tipo: ${mimetype}, tamanho: ${audioFile.size} bytes`);

            // Validar tipo de arquivo
            if (!isValidAudioFile(originalFilename, mimetype)) {
                return NextResponse.json({
                    success: false,
                    error: 'Tipo de arquivo de áudio não suportado',
                    details: 'Formatos suportados: MP3, MP4, MPEG, MPGA, M4A, WAV, WEBM'
                }, { status: 400 });
            }

            // Verificar tamanho do arquivo (limite de 25MB)
            const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
            if (audioFile.size > MAX_FILE_SIZE) {
                return NextResponse.json({
                    success: false,
                    error: 'Arquivo de áudio muito grande',
                    details: 'O tamanho máximo permitido é 25MB'
                }, { status: 400 });
            }

            // Converter para Buffer
            audioBuffer = Buffer.from(await audioFile.arrayBuffer());

        } catch (formDataError) {
            console.error('[AUDIO_API] Erro ao processar FormData:', formDataError);
            return NextResponse.json({
                success: false,
                error: 'Formato da requisição inválido',
                details: 'Esperava FormData com arquivo de áudio'
            }, { status: 400 });
        }

        // Transcrever áudio
        const transcription = await transcribeAudio(audioBuffer, originalFilename, mimetype);

        // Verificar se há texto transcrito
        if (!transcription || transcription.trim().length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Transcrição vazia',
                details: 'Não foi possível extrair texto do áudio fornecido'
            }, { status: 400 });
        }

        console.log(`[AUDIO_API] Transcrição concluída: ${transcription.length} caracteres`);

        // Se apenas transcrição foi solicitada, retornar apenas ela
        if (transcriptionOnly) {
            return NextResponse.json({
                success: true,
                transcription: transcription,
                filename: originalFilename,
                transcriptionLength: transcription.length
            });
        }

        // Realizar análise médica do conteúdo transcrito
        try {
            const analysis = await analyzeMedicalContent(transcription, analysisType);
            
            return NextResponse.json({
                success: true,
                transcription: transcription,
                analysis: analysis,
                analysisType: analysisType,
                filename: originalFilename,
                transcriptionLength: transcription.length
            });

        } catch (analysisError) {
            console.error('[AUDIO_API] Erro na análise médica:', analysisError);
            
            // Retornar pelo menos a transcrição se a análise falhar
            return NextResponse.json({
                success: true,
                transcription: transcription,
                analysis: null,
                analysisError: 'Falha na análise médica, mas transcrição foi bem-sucedida',
                filename: originalFilename,
                transcriptionLength: transcription.length
            });
        }

    } catch (error) {
        console.error('[AUDIO_API] Erro geral no processamento:', error);

        // Tratar erros específicos da OpenAI
        if (error.code === 'insufficient_quota') {
            return NextResponse.json({
                success: false,
                error: 'Limite de uso da API atingido',
                details: 'Tente novamente mais tarde'
            }, { status: 429 });
        }

        if (error.message.includes('arquivo muito grande')) {
            return NextResponse.json({
                success: false,
                error: 'Arquivo muito grande',
                details: error.message
            }, { status: 400 });
        }

        return NextResponse.json({
            success: false,
            error: 'Erro interno do servidor',
            details: error.message
        }, { status: 500 });
    }
}