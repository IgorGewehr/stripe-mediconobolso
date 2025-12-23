/**
 * API Route for linking patient to insurance (convenio)
 * Endpoint: /api/tiss/beneficiarios/vincular
 */

import { NextResponse } from 'next/server';

const TISS_SERVICE_URL = process.env.TISS_SERVICE_URL || 'http://localhost:8080/api/v1';

/**
 * POST /api/tiss/beneficiarios/vincular - Link patient to convenio
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['patient_id', 'doctor_id', 'operadora_id', 'numero_carteira', 'nome_beneficiario'];
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Campos obrigatórios faltando: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${TISS_SERVICE_URL}/beneficiarios/vincular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error linking beneficiario:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao vincular paciente ao convênio', details: error.message },
      { status: 500 }
    );
  }
}
