/**
 * API Routes for single Lote operations
 * Endpoint: /api/tiss/lotes/[id]
 */

import { NextResponse } from 'next/server';

const TISS_SERVICE_URL = process.env.TISS_SERVICE_URL || 'http://localhost:8080/api/v1';

/**
 * GET /api/tiss/lotes/[id] - Get lote by ID (complete with guias)
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const response = await fetch(`${TISS_SERVICE_URL}/lotes/${id}`);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching lote:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar lote', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tiss/lotes/[id] - Delete lote (only if open)
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const response = await fetch(`${TISS_SERVICE_URL}/lotes/${id}`, {
      method: 'DELETE',
    });

    if (response.status === 204) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error deleting lote:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar lote', details: error.message },
      { status: 500 }
    );
  }
}
