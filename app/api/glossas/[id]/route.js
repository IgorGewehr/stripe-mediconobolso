/**
 * Glossas API Routes - Individual glossa operations
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
 * GET /api/glossas/[id] - Busca glossa por ID
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const headers = await getAuthHeaders();

    const response = await fetch(`${BACKEND_URL}/api/v1/glossas/${id}`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Glossa nao encontrada' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Glossas API Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/glossas/[id] - Atualiza glossa
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const headers = await getAuthHeaders();
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/glossas/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Erro ao atualizar glossa' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Glossas API Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/glossas/[id] - Deleta glossa
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const headers = await getAuthHeaders();

    const response = await fetch(`${BACKEND_URL}/api/v1/glossas/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { error: data.error || 'Erro ao deletar glossa' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Glossas API Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/glossas/[id] - Acoes da glossa (aceitar, recuperar, perder, IA)
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const headers = await getAuthHeaders();
    const body = await request.json();
    const { action, ...data } = body;

    let endpoint = `/api/v1/glossas/${id}`;

    switch (action) {
      case 'aceitar':
        endpoint = `/api/v1/glossas/${id}/aceitar`;
        break;
      case 'recuperar':
        endpoint = `/api/v1/glossas/${id}/recuperar`;
        break;
      case 'perder':
        endpoint = `/api/v1/glossas/${id}/perder`;
        break;
      case 'analisar':
        endpoint = `/api/v1/glossas/${id}/ia/analisar`;
        break;
      case 'gerar-recurso':
        endpoint = `/api/v1/glossas/${id}/ia/gerar-recurso`;
        break;
      default:
        return NextResponse.json(
          { error: 'Acao invalida' },
          { status: 400 }
        );
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.error || 'Erro ao executar acao' },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Glossas API Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
