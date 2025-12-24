/**
 * Audio Processing API - Proxy para doctor-server
 *
 * Endpoint que faz proxy das requisições de processamento de áudio
 * para o doctor-server, onde o Whisper e GPT são executados.
 */

import { NextResponse } from 'next/server';

// Configurações da rota API para Next.js 15
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';
export const maxDuration = 600; // 10 minutos para processamento de audio longo (anamnese)

// Doctor-server API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function POST(req) {
  try {
    console.log('[AUDIO_API] Iniciando processamento de requisição de áudio');

    const doctorId = req.headers.get('X-Doctor-Id');
    if (!doctorId) {
      return NextResponse.json({
        success: false,
        error: 'Doctor ID é obrigatório',
        details: 'Header X-Doctor-Id não encontrado'
      }, { status: 400 });
    }

    // Processar FormData (upload de arquivo)
    let formData;
    try {
      formData = await req.formData();
    } catch (formDataError) {
      console.error('[AUDIO_API] Erro ao processar FormData:', formDataError);
      return NextResponse.json({
        success: false,
        error: 'Formato da requisição inválido',
        details: 'Esperava FormData com arquivo de áudio'
      }, { status: 400 });
    }

    const audioFile = formData.get('audio');
    if (!audioFile) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo de áudio não fornecido',
        details: 'Verifique se o campo "audio" está presente no formulário'
      }, { status: 400 });
    }

    const analysisType = formData.get('analysisType') || 'general';
    const transcriptionOnly = formData.get('transcriptionOnly') === 'true';

    console.log(`[AUDIO_API] Processando arquivo: ${audioFile.name}, tipo: ${audioFile.type}, tamanho: ${audioFile.size} bytes`);

    // Verificar tamanho do arquivo (limite de 25MB)
    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo de áudio muito grande',
        details: 'O tamanho máximo permitido é 25MB'
      }, { status: 400 });
    }

    // Criar novo FormData para enviar ao doctor-server
    const serverFormData = new FormData();
    serverFormData.append('audio', audioFile);
    serverFormData.append('analysis_type', analysisType);
    serverFormData.append('transcription_only', transcriptionOnly.toString());
    serverFormData.append('doctor_id', doctorId);

    // Enviar para doctor-server
    console.log(`[AUDIO_API] Enviando para doctor-server: ${API_URL}/ai/audio-processing`);

    const response = await fetch(`${API_URL}/ai/audio-processing`, {
      method: 'POST',
      body: serverFormData,
      signal: AbortSignal.timeout(540000) // 9 minutos timeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[AUDIO_API] Erro do doctor-server:', errorData);
      throw new Error(errorData.error || `Erro do servidor: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[AUDIO_API] Resposta do doctor-server recebida`);

    // Normalizar resposta do doctor-server para o formato esperado pelo frontend
    return NextResponse.json({
      success: true,
      transcription: data.transcription || data.text || '',
      analysis: data.analysis || null,
      analysisType: data.analysis_type || analysisType,
      filename: audioFile.name,
      transcriptionLength: (data.transcription || data.text || '').length
    });

  } catch (error) {
    console.error('[AUDIO_API] Erro geral no processamento:', error);

    // Tratar erros específicos
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return NextResponse.json({
        success: false,
        error: 'Timeout no processamento',
        details: 'O processamento demorou muito. Tente com um arquivo menor.'
      }, { status: 504 });
    }

    if (error.message.includes('quota') || error.message.includes('limit')) {
      return NextResponse.json({
        success: false,
        error: 'Limite de uso atingido',
        details: 'Tente novamente mais tarde'
      }, { status: 429 });
    }

    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    }, { status: 500 });
  }
}
