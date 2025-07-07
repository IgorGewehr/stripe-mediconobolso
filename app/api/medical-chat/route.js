// app/api/medical-chat/route.js
import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MEDICAL_SYSTEM_PROMPT = `Você é um assistente médico especializado, desenvolvido para apoiar profissionais de saúde com informações precisas e baseadas em evidências.

DIRETRIZES OBRIGATÓRIAS:
- Respostas EXTREMAMENTE diretas e técnicas
- Use terminologia médica adequada e precisa
- Cite dosagens, posologias e protocolos quando relevante
- Inclua contraindicações e interações importantes
- Baseie-se em guidelines atuais e evidências científicas
- Seja conciso - médicos precisam de informações rápidas
- Sempre inclua alertas sobre monitoramento necessário
- NÃO forneça diagnósticos definitivos - apenas oriente sobre possibilidades

FORMATO DE RESPOSTA:
- Vá direto ao ponto
- Use bullet points quando necessário
- Destaque informações críticas
- Mencione quando é necessário avaliação presencial

IMPORTANTE: Este é um auxílio para profissionais médicos qualificados. Decisões clínicas devem sempre considerar o contexto completo do paciente.`;

export async function POST(req) {
    try {
        const { message, conversationHistory = [] } = await req.json();

        if (!message || typeof message !== 'string' || message.trim() === '') {
            return NextResponse.json({
                success: false,
                error: 'Mensagem não pode estar vazia'
            }, { status: 400 });
        }

        // Verificar se a chave da API está configurada
        if (!process.env.OPENAI_KEY) {
            console.error('[MEDICAL_CHAT] OPENAI_KEY não configurada');
            return NextResponse.json({
                success: false,
                error: 'Configuração da IA não encontrada'
            }, { status: 500 });
        }

        // Criar cliente OpenAI
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_KEY
        });

        // Construir mensagens para a API
        const messages = [
            {
                role: "system",
                content: MEDICAL_SYSTEM_PROMPT
            }
        ];

        // Adicionar histórico da conversa (máximo 10 mensagens para controlar contexto)
        const recentHistory = conversationHistory.slice(-10);
        messages.push(...recentHistory);

        // Adicionar mensagem atual
        messages.push({
            role: "user",
            content: message.trim()
        });

        console.log(`[MEDICAL_CHAT] Processando pergunta médica: ${message.substring(0, 100)}...`);

        // Fazer chamada à API OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
            temperature: 0.1, // Baixa variabilidade para respostas mais consistentes
            max_tokens: 800,   // Limite para respostas concisas
            presence_penalty: 0.1,
            frequency_penalty: 0.1
        });

        const aiResponse = response.choices[0].message.content;

        console.log(`[MEDICAL_CHAT] Resposta gerada: ${aiResponse.substring(0, 100)}...`);

        return NextResponse.json({
            success: true,
            message: aiResponse,
            tokensUsed: response.usage?.total_tokens || 0
        });

    } catch (error) {
        console.error('[MEDICAL_CHAT] Erro ao processar chat médico:', error);

        // Tratar erros específicos da OpenAI
        if (error.code === 'insufficient_quota') {
            return NextResponse.json({
                success: false,
                error: 'Limite de uso da IA atingido. Tente novamente mais tarde.'
            }, { status: 429 });
        }

        if (error.code === 'context_length_exceeded') {
            return NextResponse.json({
                success: false,
                error: 'Conversa muito longa. Por favor, reinicie o chat.'
            }, { status: 400 });
        }

        return NextResponse.json({
            success: false,
            error: 'Erro interno do servidor. Tente novamente.'
        }, { status: 500 });
    }
}