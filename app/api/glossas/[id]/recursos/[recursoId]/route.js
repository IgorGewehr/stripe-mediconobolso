/**
 * Recursos API Routes - Individual recurso operations
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
 * GET /api/glossas/[id]/recursos/[recursoId] - Busca recurso por ID
 */
export async function GET(request, { params }) {
  try {
    const { id, recursoId } = await params;
    const headers = await getAuthHeaders();

    const response = await fetch(
      `${BACKEND_URL}/api/v1/glossas/${id}/recursos/${recursoId}`,
      {
        method: 'GET',
        headers,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Recurso nao encontrado' },
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
 * PUT /api/glossas/[id]/recursos/[recursoId] - Atualiza recurso
 */
export async function PUT(request, { params }) {
  try {
    const { id, recursoId } = await params;
    const headers = await getAuthHeaders();
    const body = await request.json();

    const response = await fetch(
      `${BACKEND_URL}/api/v1/glossas/${id}/recursos/${recursoId}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Erro ao atualizar recurso' },
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
 * DELETE /api/glossas/[id]/recursos/[recursoId] - Deleta recurso
 */
export async function DELETE(request, { params }) {
  try {
    const { id, recursoId } = await params;
    const headers = await getAuthHeaders();

    const response = await fetch(
      `${BACKEND_URL}/api/v1/glossas/${id}/recursos/${recursoId}`,
      {
        method: 'DELETE',
        headers,
      }
    );

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { error: data.error || 'Erro ao deletar recurso' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Recursos API Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/glossas/[id]/recursos/[recursoId] - Acoes do recurso
 */
export async function POST(request, { params }) {
  try {
    const { id, recursoId } = await params;
    const headers = await getAuthHeaders();
    const body = await request.json();
    const { action, ...data } = body;

    let endpoint = `/api/v1/glossas/${id}/recursos/${recursoId}`;

    switch (action) {
      case 'iniciar':
        endpoint = `/api/v1/glossas/${id}/recursos/${recursoId}/iniciar`;
        break;
      case 'enviar':
        endpoint = `/api/v1/glossas/${id}/recursos/${recursoId}/enviar`;
        break;
      case 'resposta':
        endpoint = `/api/v1/glossas/${id}/recursos/${recursoId}/resposta`;
        break;
      case 'documentos':
        endpoint = `/api/v1/glossas/${id}/recursos/${recursoId}/documentos`;
        break;
      case 'melhorar':
        endpoint = `/api/v1/glossas/${id}/recursos/${recursoId}/ia/melhorar`;
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
    console.error('Recursos API Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
