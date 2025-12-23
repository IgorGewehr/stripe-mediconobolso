/**
 * API Routes for TUSS (Terminologia Unificada da Saúde Suplementar)
 * Endpoint: /api/tiss/tuss
 */

import { NextResponse } from 'next/server';

const TISS_SERVICE_URL = process.env.TISS_SERVICE_URL || 'http://localhost:8080/api/v1';

/**
 * GET /api/tiss/tuss - List TUSS codes with filters
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Check for autocomplete
    const termo = searchParams.get('termo');
    if (termo) {
      const tipo = searchParams.get('tipo') || '';
      const limit = searchParams.get('limit') || '20';

      const response = await fetch(
        `${TISS_SERVICE_URL}/tuss/autocomplete?termo=${encodeURIComponent(termo)}&tipo=${tipo}&limit=${limit}`
      );
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    // Build query string from search params
    const queryParams = new URLSearchParams();

    const params = [
      'codigo',
      'termo',
      'tipo',
      'tabela_origem',
      'apenas_ativos',
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
      `${TISS_SERVICE_URL}/tuss?${queryParams.toString()}`
    );
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching TUSS codes:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar códigos TUSS', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tiss/tuss - Create new TUSS code
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['codigo', 'termo', 'tipo'];
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

    const response = await fetch(`${TISS_SERVICE_URL}/tuss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating TUSS code:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar código TUSS', details: error.message },
      { status: 500 }
    );
  }
}
