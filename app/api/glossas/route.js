/**
 * Glossas API Routes - Main endpoint
 * Proxies requests to the Rust backend
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const BACKEND_URL = process.env.DOCTOR_SERVER_URL || 'http://localhost:8080';

async function getAuthHeaders() {
  const headersList = await headers();
  const authorization = headersList.get('authorization');

  if (!authorization) {
    return null; // No auth header
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': authorization,
  };
}

/**
 * GET /api/glossas - Lista glossas ou busca estatisticas/dashboard
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeaders = await getAuthHeaders();

    if (!authHeaders) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

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
      headers: authHeaders,
    });

    // Handle empty or non-JSON responses
    const text = await response.text();
    let data = {};

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        // Backend returned non-JSON (e.g., "Requested resource not found")
        data = { error: text };
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.message || 'Erro ao buscar glossas' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Glossas API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/glossas - Cria nova glossa ou executa acao
 */
export async function POST(request) {
  try {
    const authHeaders = await getAuthHeaders();

    if (!authHeaders) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

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
      headers: authHeaders,
      body: JSON.stringify(payload),
    });

    // Handle empty or non-JSON responses
    const text = await response.text();
    let responseData = {};

    if (text) {
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = { error: text };
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.error || responseData.message || 'Erro ao criar glossa' },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Glossas API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
