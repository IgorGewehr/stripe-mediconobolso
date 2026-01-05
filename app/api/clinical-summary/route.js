/**
 * Clinical Summary API - Proxy para doctor-server
 *
 * Endpoint que faz proxy das requisições de resumo clínico
 * para o doctor-server, onde o GPT gera resumos inteligentes.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function POST(req) {
  try {
    console.log('[CLINICAL_SUMMARY_API] Iniciando geração de resumo clínico');

    const doctorId = req.headers.get('X-Doctor-Id');
    if (!doctorId) {
      return NextResponse.json({
        success: false,
        error: 'Doctor ID é obrigatório',
        details: 'Header X-Doctor-Id não encontrado'
      }, { status: 400 });
    }

    const body = await req.json();
    const { patientData, patientId } = body;

    if (!patientData || typeof patientData !== 'string' || patientData.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Dados do paciente são obrigatórios',
        details: 'O campo patientData deve conter informações do paciente'
      }, { status: 400 });
    }

    console.log(`[CLINICAL_SUMMARY_API] Gerando resumo para paciente: ${patientId || 'não informado'}`);

    const response = await fetch(`${API_URL}/ai/clinical-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doctor_id: doctorId,
        patient_data: patientData,
        patient_id: patientId || null
      }),
      signal: AbortSignal.timeout(90000)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[CLINICAL_SUMMARY_API] Erro do doctor-server:', errorData);

      if (response.status === 429) {
        return NextResponse.json({
          success: false,
          error: 'Limite de uso atingido',
          details: 'Tente novamente mais tarde'
        }, { status: 429 });
      }

      throw new Error(errorData.error || `Erro do servidor: ${response.status}`);
    }

    const data = await response.json();
    console.log('[CLINICAL_SUMMARY_API] Resumo clínico gerado com sucesso');

    return NextResponse.json({
      success: true,
      profileSummary: data.profile_summary || data.data?.profile_summary || '',
      alerts: data.alerts || data.data?.alerts || [],
      examAnalysis: data.exam_analysis || data.data?.exam_analysis || null,
      medicationAnalysis: data.medication_analysis || data.data?.medication_analysis || null,
      recommendations: data.recommendations || data.data?.recommendations || [],
      generatedAt: data.generated_at || data.data?.generated_at || new Date().toISOString()
    });

  } catch (error) {
    console.error('[CLINICAL_SUMMARY_API] Erro ao gerar resumo:', error);

    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return NextResponse.json({
        success: false,
        error: 'Timeout na geração do resumo',
        details: 'O processamento demorou muito. Tente com menos dados.'
      }, { status: 504 });
    }

    return NextResponse.json({
      success: false,
      error: 'Erro ao gerar resumo clínico',
      details: error.message
    }, { status: 500 });
  }
}
