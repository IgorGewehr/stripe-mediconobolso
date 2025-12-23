/**
 * API Routes for Guias (TISS Documents)
 * Endpoint: /api/tiss/guias
 */

import { NextResponse } from 'next/server';

const TISS_SERVICE_URL = process.env.TISS_SERVICE_URL || 'http://localhost:8080/api/v1';

/**
 * GET /api/tiss/guias - List guias with filters
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Build query string from search params
    const queryParams = new URLSearchParams();

    const params = [
      'doctor_id',
      'operadora_id',
      'beneficiario_id',
      'status',
      'tipo_guia',
      'data_inicio',
      'data_fim',
      'tem_glosa',
      'page',
      'per_page',
    ];

    params.forEach((param) => {
      const value = searchParams.get(param);
      if (value) {
        queryParams.append(param, value);
      }
    });

    const response = await fetch(
      `${TISS_SERVICE_URL}/guias?${queryParams.toString()}`
    );
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching guias:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar guias', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tiss/guias - Create new guia
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['doctor_id', 'tipo_guia', 'data_atendimento'];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Campos obrigatórios faltando: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${TISS_SERVICE_URL}/guias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating guia:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar guia', details: error.message },
      { status: 500 }
    );
  }
}
