/**
 * Exam Processing API - Proxy para doctor-server
 *
 * Endpoint que faz proxy das requisições de processamento de exames
 * para o doctor-server, onde OCR e GPT são executados.
 */

import { NextResponse } from 'next/server';

// Configurações da rota API para Next.js 15
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';
export const maxDuration = 300; // 5 minutos para processamento de exames

// Doctor-server API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function POST(req) {
  try {
    console.log('[EXAM_API] Iniciando processamento de requisição');

    const doctorId = req.headers.get('X-Doctor-Id');
    if (!doctorId) {
      return NextResponse.json({
        success: false,
        error: 'Doctor ID é obrigatório',
        details: 'Header X-Doctor-Id não encontrado'
      }, { status: 400 });
    }

    // Tentar processar como FormData (upload de arquivo)
    let formData;
    let isFormData = true;

    try {
      formData = await req.formData();
    } catch {
      isFormData = false;
    }

    if (isFormData && formData) {
      const file = formData.get('file');
      const extractType = formData.get('extractType') || 'exam';

      if (!file) {
        return NextResponse.json({
          success: false,
          error: 'Arquivo não fornecido',
          details: 'Verifique se o campo "file" está presente no formulário'
        }, { status: 400 });
      }

      console.log(`[EXAM_API] Processando arquivo: ${file.name}, tipo: ${file.type}, tamanho: ${file.size} bytes`);

      // Verificar tamanho do arquivo (limite de 15MB)
      const MAX_FILE_SIZE = 15 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({
          success: false,
          error: 'Arquivo muito grande',
          details: 'O tamanho máximo permitido é 15MB'
        }, { status: 400 });
      }

      // Verificar tipo de arquivo
      const fileName = file.name.toLowerCase();
      const fileType = file.type;
      const isValidType =
        fileType === 'application/pdf' ||
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType.startsWith('image/') ||
        fileName.endsWith('.pdf') ||
        fileName.endsWith('.docx') ||
        fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/);

      if (!isValidType) {
        return NextResponse.json({
          success: false,
          error: 'Tipo de arquivo não suportado',
          details: 'Por favor, envie arquivos nos formatos PDF, DOCX ou imagens (JPG, JPEG, PNG, GIF)'
        }, { status: 400 });
      }

      // Criar FormData para enviar ao doctor-server
      const serverFormData = new FormData();
      serverFormData.append('file', file);
      serverFormData.append('extract_type', extractType);
      serverFormData.append('doctor_id', doctorId);

      // Enviar para doctor-server
      console.log(`[EXAM_API] Enviando para doctor-server: ${API_URL}/ai/analyze-exam`);

      const response = await fetch(`${API_URL}/ai/analyze-exam`, {
        method: 'POST',
        body: serverFormData,
        signal: AbortSignal.timeout(270000) // 4.5 minutos timeout
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[EXAM_API] Erro do doctor-server:', errorData);
        throw new Error(errorData.error || `Erro do servidor: ${response.status}`);
      }

      const data = await response.json();
      console.log('[EXAM_API] Resposta do doctor-server recebida');

      return NextResponse.json({
        success: true,
        data: data.results || data.data || data,
        source: 'file-upload',
        fileType: file.type,
        fileName: file.name,
        textLength: data.text_length || 0
      });

    } else {
      // Processar como JSON (texto direto ou URL)
      let body;
      try {
        // Re-criar a request para ler o body como JSON
        const clonedReq = req.clone();
        body = await clonedReq.json();
      } catch (jsonError) {
        return NextResponse.json({
          success: false,
          error: 'Formato da requisição inválido',
          details: 'Esperava FormData (arquivo) ou JSON (text/url)'
        }, { status: 400 });
      }

      if (body.url) {
        console.log(`[EXAM_API] Processando URL: ${body.url}`);

        // Enviar URL para doctor-server processar
        const response = await fetch(`${API_URL}/ai/analyze-exam`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            doctor_id: doctorId,
            url: body.url,
            extract_type: body.extractType || 'exam'
          }),
          signal: AbortSignal.timeout(270000)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Erro do servidor: ${response.status}`);
        }

        const data = await response.json();

        return NextResponse.json({
          success: true,
          data: data.results || data.data || data,
          source: 'remote-url'
        });

      } else if (body.text) {
        console.log(`[EXAM_API] Processando texto direto: ${body.text.length} caracteres`);

        // Enviar texto para doctor-server processar
        const response = await fetch(`${API_URL}/ai/analyze-exam`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            doctor_id: doctorId,
            text: body.text,
            extract_type: body.extractType || 'exam'
          }),
          signal: AbortSignal.timeout(60000)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Erro do servidor: ${response.status}`);
        }

        const data = await response.json();

        return NextResponse.json({
          success: true,
          data: data.results || data.data || data,
          source: 'direct-text',
          textLength: body.text.length
        });

      } else {
        return NextResponse.json({
          success: false,
          error: 'Corpo da requisição inválido',
          details: 'Esperava um objeto com "text" ou "url"'
        }, { status: 400 });
      }
    }

  } catch (error) {
    console.error('[EXAM_API] Erro geral não tratado:', error);

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
      error: 'Falha no processamento',
      details: error.message
    }, { status: 500 });
  }
}
