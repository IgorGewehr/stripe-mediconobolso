/**
 * API Routes for single Operadora operations
 * Endpoint: /api/tiss/operadoras/[id]
 */

import { NextResponse } from 'next/server';

const TISS_SERVICE_URL = process.env.TISS_SERVICE_URL || 'http://localhost:8080/api/v1';

/**
 * GET /api/tiss/operadoras/[id] - Get operadora by ID
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const response = await fetch(`${TISS_SERVICE_URL}/operadoras/${id}`);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching operadora:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar operadora', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tiss/operadoras/[id] - Update operadora
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const response = await fetch(`${TISS_SERVICE_URL}/operadoras/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating operadora:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar operadora', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tiss/operadoras/[id] - Deactivate operadora
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const response = await fetch(`${TISS_SERVICE_URL}/operadoras/${id}`, {
      method: 'DELETE',
    });

    if (response.status === 204) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error deleting operadora:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao desativar operadora', details: error.message },
      { status: 500 }
    );
  }
}
