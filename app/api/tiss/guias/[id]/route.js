/**
 * API Routes for single Guia operations
 * Endpoint: /api/tiss/guias/[id]
 */

import { NextResponse } from 'next/server';

const TISS_SERVICE_URL = process.env.TISS_SERVICE_URL || 'http://localhost:8080/api/v1';

/**
 * GET /api/tiss/guias/[id] - Get guia by ID (complete with procedimentos)
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const response = await fetch(`${TISS_SERVICE_URL}/guias/${id}`);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching guia:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar guia', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tiss/guias/[id] - Update guia
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const response = await fetch(`${TISS_SERVICE_URL}/guias/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating guia:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar guia', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tiss/guias/[id] - Delete guia
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const response = await fetch(`${TISS_SERVICE_URL}/guias/${id}`, {
      method: 'DELETE',
    });

    if (response.status === 204) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error deleting guia:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao deletar guia', details: error.message },
      { status: 500 }
    );
  }
}
