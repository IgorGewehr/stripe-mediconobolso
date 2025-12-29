/**
 * Recursos API Routes - List and create recursos for a glossa
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.DOCTOR_SERVER_URL || 'http://localhost:8080';

async function getAuthHeaders() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value || cookieStore.get('token')?.value;

  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

/**
 * GET /api/glossas/[id]/recursos - Lista recursos da glossa
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const headers = await getAuthHeaders();

    const response = await fetch(`${BACKEND_URL}/api/v1/glossas/${id}/recursos`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Erro ao buscar recursos' },
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
    const headers = await getAuthHeaders();
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/glossas/${id}/recursos`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Erro ao criar recurso' },
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
