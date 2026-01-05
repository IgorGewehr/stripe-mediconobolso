/**
 * Anamnese Audio API - Proxy para doctor-server
 *
 * Endpoint que faz proxy das requisições de processamento de áudio de anamnese
 * para o doctor-server, onde Whisper transcreve e GPT estrutura os campos.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';
export const maxDuration = 600;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function POST(req) {
  try {
    console.log('[ANAMNESE_AUDIO_API] Iniciando processamento de anamnese por áudio');

    const doctorId = req.headers.get('X-Doctor-Id');
    if (!doctorId) {
      return NextResponse.json({
        success: false,
        error: 'Doctor ID é obrigatório',
        details: 'Header X-Doctor-Id não encontrado'
      }, { status: 400 });
    }

    let formData;
    try {
      formData = await req.formData();
    } catch (formDataError) {
      console.error('[ANAMNESE_AUDIO_API] Erro ao processar FormData:', formDataError);
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
        details: 'Verifique se o campo "audio" está presente'
      }, { status: 400 });
    }

    const patientId = formData.get('patientId');
    const storeFile = formData.get('storeFile') === 'true';

    console.log(`[ANAMNESE_AUDIO_API] Processando: ${audioFile.name}, tamanho: ${audioFile.size} bytes`);

    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo muito grande',
        details: 'O tamanho máximo permitido é 25MB'
      }, { status: 400 });
    }

    const serverFormData = new FormData();
    serverFormData.append('audio', audioFile);
    serverFormData.append('doctor_id', doctorId);
    if (patientId) serverFormData.append('patient_id', patientId);
    if (storeFile) serverFormData.append('store_file', 'true');

    console.log(`[ANAMNESE_AUDIO_API] Enviando para: ${API_URL}/ai/anamnese-audio`);

    const response = await fetch(`${API_URL}/ai/anamnese-audio`, {
      method: 'POST',
      body: serverFormData,
      signal: AbortSignal.timeout(540000)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[ANAMNESE_AUDIO_API] Erro do doctor-server:', errorData);
      throw new Error(errorData.error || `Erro do servidor: ${response.status}`);
    }

    const data = await response.json();
    console.log('[ANAMNESE_AUDIO_API] Anamnese processada com sucesso');

    return NextResponse.json({
      success: true,
      transcription: data.transcription || '',
      anamnese: data.anamnese || null,
      fileId: data.file_id || null,
      fileUrl: data.file_url || null,
      filename: audioFile.name
    });

  } catch (error) {
    console.error('[ANAMNESE_AUDIO_API] Erro geral:', error);

    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return NextResponse.json({
        success: false,
        error: 'Timeout no processamento',
        details: 'O áudio é muito longo. Tente com um arquivo menor.'
      }, { status: 504 });
    }

    return NextResponse.json({
      success: false,
      error: 'Erro ao processar anamnese',
      details: error.message
    }, { status: 500 });
  }
}
