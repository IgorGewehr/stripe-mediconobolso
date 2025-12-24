/**
 * Medical Chat API - Proxy para doctor-server
 *
 * Endpoint que faz proxy das requisições de chat médico
 * para o doctor-server, onde o GPT é executado.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Doctor-server API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function POST(req) {
  try {
    const { message, conversationHistory = [], userId, conversationId } = await req.json();

    const doctorId = req.headers.get('X-Doctor-Id') || userId;
    if (!doctorId) {
      return NextResponse.json({
        success: false,
        error: 'Doctor ID é obrigatório'
      }, { status: 400 });
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Mensagem não pode estar vazia'
      }, { status: 400 });
    }

    console.log(`[MEDICAL_CHAT] Processando pergunta médica: ${message.substring(0, 100)}...`);

    // Enviar para doctor-server
    const response = await fetch(`${API_URL}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doctor_id: doctorId,
        message: message.trim(),
        conversation_history: conversationHistory,
        conversation_id: conversationId || null
      }),
      signal: AbortSignal.timeout(60000) // 60 segundos timeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[MEDICAL_CHAT] Erro do doctor-server:', errorData);

      // Tratar rate limiting do server
      if (response.status === 429) {
        return NextResponse.json({
          success: false,
          error: 'Muitas solicitações. Aguarde um momento antes de tentar novamente.',
          retryAfter: errorData.retry_after || 60
        }, { status: 429 });
      }

      throw new Error(errorData.error || `Erro do servidor: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[MEDICAL_CHAT] Resposta recebida: ${(data.message || '').substring(0, 100)}...`);

    return NextResponse.json({
      success: true,
      message: data.message || data.response || '',
      tokensUsed: data.tokens_used || 0,
      conversationId: data.conversation_id || conversationId
    });

  } catch (error) {
    console.error('[MEDICAL_CHAT] Erro ao processar chat médico:', error);

    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return NextResponse.json({
        success: false,
        error: 'Timeout na resposta. Tente novamente.'
      }, { status: 504 });
    }

    if (error.message.includes('quota') || error.message.includes('limit')) {
      return NextResponse.json({
        success: false,
        error: 'Limite de uso da IA atingido. Tente novamente mais tarde.'
      }, { status: 429 });
    }

    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor. Tente novamente.'
    }, { status: 500 });
  }
}
