/**
 * Clinical Report API - Proxy para doctor-server
 *
 * Endpoint que faz proxy das requisições de relatório clínico
 * para o doctor-server, onde o GPT é executado.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Doctor-server API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function POST(req) {
  try {
    const body = await req.json();
    const { pacienteData, doctorId, patientId } = body;

    if (!pacienteData || !doctorId || !patientId) {
      return NextResponse.json({
        success: false,
        error: 'Dados incompletos para gerar o relatório clínico'
      }, { status: 400 });
    }

    console.log(`[RELATORIO_API] Gerando relatório para paciente: ${patientId}`);

    // Enviar para doctor-server
    const response = await fetch(`${API_URL}/ai/clinical-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        doctor_id: doctorId,
        patient_id: patientId,
        patient_data: pacienteData
      }),
      signal: AbortSignal.timeout(60000) // 60 segundos timeout
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[RELATORIO_API] Erro do doctor-server:', errorData);
      throw new Error(errorData.error || `Erro do servidor: ${response.status}`);
    }

    const data = await response.json();
    console.log('[RELATORIO_API] Relatório gerado com sucesso');

    // Normalizar resposta para o formato esperado pelo frontend
    return NextResponse.json({
      success: true,
      data: {
        profileSummary: data.profile_summary || data.profileSummary || '',
        alerts: data.alerts || [],
        examAnalysis: data.exam_analysis || data.examAnalysis || 'Não há dados de exames suficientes para análise.',
        medicationAnalysis: data.medication_analysis || data.medicationAnalysis || 'Não há dados de medicações suficientes para análise.',
        recommendations: data.recommendations || [],
        generatedAt: data.generated_at || data.generatedAt || new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('[RELATORIO_API] Erro ao processar relatório:', error);

    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return NextResponse.json({
        success: false,
        error: 'Timeout na geração do relatório. Tente novamente.'
      }, { status: 504 });
    }

    return NextResponse.json({
      success: false,
      error: 'Erro ao gerar relatório clínico: ' + (error.message || 'Erro desconhecido')
    }, { status: 500 });
  }
}
