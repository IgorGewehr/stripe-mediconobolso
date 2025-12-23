/**
 * API Routes for Guia Procedimentos
 * Endpoint: /api/tiss/guias/[id]/procedimentos
 */

import { NextResponse } from 'next/server';

const TISS_SERVICE_URL = process.env.TISS_SERVICE_URL || 'http://localhost:8080/api/v1';

/**
 * GET /api/tiss/guias/[id]/procedimentos - List procedimentos of a guia
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const response = await fetch(`${TISS_SERVICE_URL}/guias/${id}/procedimentos`);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching procedimentos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar procedimentos', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tiss/guias/[id]/procedimentos - Add procedimento to guia
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['codigo_tuss', 'descricao_procedimento', 'valor_unitario'];
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

    const response = await fetch(`${TISS_SERVICE_URL}/guias/${id}/procedimentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error adding procedimento:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao adicionar procedimento', details: error.message },
      { status: 500 }
    );
  }
}
