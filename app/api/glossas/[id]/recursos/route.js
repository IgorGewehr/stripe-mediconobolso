/**
 * Recursos API Routes - List and create recursos for a glossa
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const BACKEND_URL = process.env.DOCTOR_SERVER_URL || 'http://localhost:8080';

async function getAuthHeaders() {
  const headersList = await headers();
  const authorization = headersList.get('authorization');

  if (!authorization) {
    return null;
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': authorization,
  };
}

// Helper to safely parse JSON response (handles empty bodies)
async function safeJsonParse(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

/**
 * GET /api/glossas/[id]/recursos - Lista recursos da glossa
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const authHeaders = await getAuthHeaders();

    if (!authHeaders) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/glossas/${id}/recursos`, {
      method: 'GET',
      headers: authHeaders,
    });

    const data = await safeJsonParse(response);

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.message || 'Erro ao buscar recursos' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Recursos API Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/glossas/[id]/recursos - Cria novo recurso
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const authHeaders = await getAuthHeaders();

    if (!authHeaders) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/glossas/${id}/recursos`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(body),
    });

    const data = await safeJsonParse(response);

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.message || 'Erro ao criar recurso' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Recursos API Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
