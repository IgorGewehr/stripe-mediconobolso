/**
 * Recursos API Routes - Individual recurso operations
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
 * GET /api/glossas/[id]/recursos/[recursoId] - Busca recurso por ID
 */
export async function GET(request, { params }) {
  try {
    const { id, recursoId } = await params;
    const authHeaders = await getAuthHeaders();

    if (!authHeaders) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const response = await fetch(
      `${BACKEND_URL}/api/v1/glossas/${id}/recursos/${recursoId}`,
      {
        method: 'GET',
        headers: authHeaders,
      }
    );

    const data = await safeJsonParse(response);

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.message || 'Recurso nao encontrado' },
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
    const authHeaders = await getAuthHeaders();

    if (!authHeaders) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(
      `${BACKEND_URL}/api/v1/glossas/${id}/recursos/${recursoId}`,
      {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(body),
      }
    );

    const data = await safeJsonParse(response);

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.message || 'Erro ao atualizar recurso' },
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
    const authHeaders = await getAuthHeaders();

    if (!authHeaders) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const response = await fetch(
      `${BACKEND_URL}/api/v1/glossas/${id}/recursos/${recursoId}`,
      {
        method: 'DELETE',
        headers: authHeaders,
      }
    );

    if (!response.ok) {
      const data = await safeJsonParse(response);
      return NextResponse.json(
        { error: data.error || data.message || 'Erro ao deletar recurso' },
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
    const authHeaders = await getAuthHeaders();

    if (!authHeaders) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

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
      headers: authHeaders,
      body: JSON.stringify(data),
    });

    const responseData = await safeJsonParse(response);

    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.error || responseData.message || 'Erro ao executar acao' },
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
