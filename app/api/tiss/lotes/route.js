/**
 * API Routes for Lotes (Billing Batches)
 * Endpoint: /api/tiss/lotes
 */

import { NextResponse } from 'next/server';

const TISS_SERVICE_URL = process.env.TISS_SERVICE_URL || 'http://localhost:8080/api/v1';

/**
 * GET /api/tiss/lotes - List lotes with filters
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Build query string from search params
    const queryParams = new URLSearchParams();

    const params = [
      'doctor_id',
      'operadora_id',
      'status',
      'data_inicio',
      'data_fim',
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
      `${TISS_SERVICE_URL}/lotes?${queryParams.toString()}`
    );
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching lotes:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar lotes', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tiss/lotes - Create new lote
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      'doctor_id',
      'operadora_id',
      'data_inicio_competencia',
      'data_fim_competencia',
      'guia_ids',
    ];
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

    if (!Array.isArray(body.guia_ids) || body.guia_ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'O lote deve conter pelo menos uma guia',
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${TISS_SERVICE_URL}/lotes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating lote:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar lote', details: error.message },
      { status: 500 }
    );
  }
}
