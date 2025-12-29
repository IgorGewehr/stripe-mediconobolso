/**
 * Glossas API Routes - Main endpoint
 * Proxies requests to the Rust backend
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
 * GET /api/glossas - Lista glossas ou busca estatisticas/dashboard
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const headers = await getAuthHeaders();

    // Determinar qual endpoint chamar baseado nos parametros
    let endpoint = '/api/v1/glossas';

    // Checar se e uma rota especial
    const action = searchParams.get('action');
    if (action === 'dashboard') {
      endpoint = '/api/v1/glossas/dashboard';
    } else if (action === 'estatisticas') {
      endpoint = '/api/v1/glossas/estatisticas';
    } else if (action === 'ranking-convenios') {
      endpoint = '/api/v1/glossas/ranking-convenios';
    } else if (action === 'tendencias') {
      endpoint = '/api/v1/glossas/tendencias';
    } else if (action === 'ia-status') {
      endpoint = '/api/v1/glossas/ia/status';
    }

    // Remover action dos params e passar o resto
    const params = new URLSearchParams();
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'action' && value) {
        params.append(key, value);
      }
    }

    const queryString = params.toString();
    const url = `${BACKEND_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Erro ao buscar glossas' },
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
 * POST /api/glossas - Cria nova glossa ou executa acao
 */
export async function POST(request) {
  try {
    const headers = await getAuthHeaders();
    const body = await request.json();

    // Checar se e uma acao especial
    const { action, ...data } = body;

    let endpoint = '/api/v1/glossas';
    let payload = data;

    if (action === 'analisar-padroes') {
      endpoint = '/api/v1/glossas/ia/analisar-padroes';
      payload = data;
    }

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.error || 'Erro ao criar glossa' },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Glossas API Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
