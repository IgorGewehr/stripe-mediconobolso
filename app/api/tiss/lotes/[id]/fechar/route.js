/**
 * API Route for closing a Lote and generating XML
 * Endpoint: /api/tiss/lotes/[id]/fechar
 */

import { NextResponse } from 'next/server';

const TISS_SERVICE_URL = process.env.TISS_SERVICE_URL || 'http://localhost:8080/api/v1';

/**
 * POST /api/tiss/lotes/[id]/fechar - Close lote and generate XML
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const response = await fetch(`${TISS_SERVICE_URL}/lotes/${id}/fechar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gerar_xml: body.gerar_xml !== false, // Default to true
      }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error closing lote:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao fechar lote', details: error.message },
      { status: 500 }
    );
  }
}
