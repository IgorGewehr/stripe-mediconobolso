/**
 * API Route for importing TUSS codes in bulk
 * Endpoint: /api/tiss/tuss/import
 */

import { NextResponse } from 'next/server';

const TISS_SERVICE_URL = process.env.TISS_SERVICE_URL || 'http://localhost:8080/api/v1';

/**
 * POST /api/tiss/tuss/import - Import TUSS codes in bulk
 */
export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum item para importar' },
        { status: 400 }
      );
    }

    const response = await fetch(`${TISS_SERVICE_URL}/tuss/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: body.items,
        sobrescrever_existentes: body.sobrescrever_existentes || false,
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error importing TUSS codes:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao importar códigos TUSS', details: error.message },
      { status: 500 }
    );
  }
}
