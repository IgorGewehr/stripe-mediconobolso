/**
 * Process Exam Document API - Proxy para doctor-server
 *
 * Endpoint que faz proxy das requisições de processamento de documentos de exame
 * para o doctor-server, onde OCR/PDF extract + GPT analisam e estruturam os dados.
 * Retorna dados prontos para preenchimento automático de formulários.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';
export const maxDuration = 300;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function POST(req) {
  try {
    console.log('[EXAM_DOC_API] Iniciando processamento de documento de exame');

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
      console.error('[EXAM_DOC_API] Erro ao processar FormData:', formDataError);
      return NextResponse.json({
        success: false,
        error: 'Formato da requisição inválido',
        details: 'Esperava FormData com arquivo (PDF ou imagem)'
      }, { status: 400 });
    }

    const file = formData.get('file') || formData.get('document') || formData.get('image');
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo não fornecido',
        details: 'Verifique se o campo "file", "document" ou "image" está presente'
      }, { status: 400 });
    }

    console.log(`[EXAM_DOC_API] Processando: ${file.name}, tipo: ${file.type}, tamanho: ${file.size} bytes`);

    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: 'Arquivo muito grande',
        details: 'O tamanho máximo permitido é 20MB'
      }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const fileType = file.type;
    const isValidType =
      fileType === 'application/pdf' ||
      fileType.startsWith('image/') ||
      fileName.endsWith('.pdf') ||
      fileName.match(/\.(jpg|jpeg|png|gif|webp)$/);

    if (!isValidType) {
      return NextResponse.json({
        success: false,
        error: 'Tipo de arquivo não suportado',
        details: 'Use PDF ou imagem (JPG, JPEG, PNG, GIF, WebP)'
      }, { status: 400 });
    }

    const serverFormData = new FormData();
    serverFormData.append('file', file);
    serverFormData.append('doctor_id', doctorId);

    console.log(`[EXAM_DOC_API] Enviando para: ${API_URL}/ai/process-exam-document`);

    const response = await fetch(`${API_URL}/ai/process-exam-document`, {
      method: 'POST',
      body: serverFormData,
      signal: AbortSignal.timeout(270000)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[EXAM_DOC_API] Erro do doctor-server:', errorData);
      throw new Error(errorData.error || `Erro do servidor: ${response.status}`);
    }

    const data = await response.json();
    console.log('[EXAM_DOC_API] Documento processado com sucesso');

    return NextResponse.json({
      success: true,
      extractedText: data.extracted_text || null,
      documentType: data.document_type || null,
      suggestedExamName: data.suggested_exam_name || null,
      suggestedExamType: data.suggested_exam_type || null,
      suggestedExamCategory: data.suggested_exam_category || null,
      examCategories: data.exam_categories || null,
      hasAbnormalResults: data.has_abnormal_results || false,
      conclusion: data.conclusion || null,
      examDate: data.exam_date || null,
      laboratory: data.laboratory || null,
      performedBy: data.performed_by || null,
      fileName: file.name,
      fileType: file.type
    });

  } catch (error) {
    console.error('[EXAM_DOC_API] Erro geral:', error);

    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return NextResponse.json({
        success: false,
        error: 'Timeout no processamento',
        details: 'O documento é muito grande ou complexo. Tente um arquivo menor.'
      }, { status: 504 });
    }

    return NextResponse.json({
      success: false,
      error: 'Erro ao processar documento',
      details: error.message
    }, { status: 500 });
  }
}
