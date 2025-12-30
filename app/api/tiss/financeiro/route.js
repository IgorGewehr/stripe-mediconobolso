/**
 * API Routes for Financial (Contas a Receber)
 * Endpoint: /api/tiss/financeiro
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const TISS_SERVICE_URL = process.env.TISS_SERVICE_URL || 'http://localhost:8080/api/v1';

// Helper to safely parse JSON response (handles empty bodies)
async function safeJsonParse(response, defaultValue = {}) {
  try {
    const text = await response.text();
    if (!text) return defaultValue;
    return JSON.parse(text);
  } catch {
    return defaultValue;
  }
}

/**
 * GET /api/tiss/financeiro - List contas a receber or get resumo/previsao
 */
export async function GET(request) {
  try {
    const headersList = await headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    let endpoint;

    if (action === 'resumo') {
      const dataInicio = searchParams.get('data_inicio');
      const dataFim = searchParams.get('data_fim');

      if (!dataInicio || !dataFim) {
        return NextResponse.json(
          { success: false, error: 'data_inicio e data_fim são obrigatórios para resumo' },
          { status: 400 }
        );
      }

      endpoint = `/billing/financeiro/resumo?data_inicio=${dataInicio}&data_fim=${dataFim}`;
    } else if (action === 'previsao') {
      const meses = searchParams.get('meses') || '3';
      endpoint = `/billing/financeiro/previsao?meses=${meses}`;
    } else {
      // List contas a receber
      const queryParams = new URLSearchParams();

      const params = ['operadora_id', 'status', 'data_inicio', 'data_fim', 'page', 'per_page'];
      params.forEach((param) => {
        const value = searchParams.get(param);
        if (value) queryParams.append(param, value);
      });

      endpoint = `/billing/contas-receber?${queryParams.toString()}`;
    }

    const response = await fetch(`${TISS_SERVICE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
      },
    });

    const data = await safeJsonParse(response, {});

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || 'Erro ao buscar dados financeiros' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching financial data:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar dados financeiros', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tiss/financeiro - Create conta a receber or register payment
 */
export async function POST(request) {
  try {
    const headersList = await headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const authHeaders = {
      'Authorization': authorization,
      'Content-Type': 'application/json',
    };

    const body = await request.json();
    const { action, ...data } = body;

    let response;

    switch (action) {
      case 'criar_de_lote':
        if (!data.lote_id) {
          return NextResponse.json(
            { success: false, error: 'lote_id é obrigatório' },
            { status: 400 }
          );
        }
        response = await fetch(`${TISS_SERVICE_URL}/billing/contas-receber/lote/${data.lote_id}`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ dias_para_pagamento: data.dias_para_pagamento || 45 }),
        });
        break;

      case 'registrar_recebimento':
        if (!data.conta_id) {
          return NextResponse.json(
            { success: false, error: 'conta_id é obrigatório' },
            { status: 400 }
          );
        }
        response = await fetch(`${TISS_SERVICE_URL}/billing/contas-receber/${data.conta_id}/recebimento`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            valor_recebido: data.valor_recebido,
            valor_glosado: data.valor_glosado,
            data_recebimento: data.data_recebimento,
            numero_demonstrativo: data.numero_demonstrativo,
            observacoes: data.observacoes,
          }),
        });
        break;

      default:
        // Create new conta a receber
        response = await fetch(`${TISS_SERVICE_URL}/billing/contas-receber`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(data),
        });
    }

    const responseData = await safeJsonParse(response, {});

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: responseData.error || responseData.message || 'Erro na operação financeira' },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error in financial operation:', error);
    return NextResponse.json(
      { success: false, error: 'Erro na operação financeira', details: error.message },
      { status: 500 }
    );
  }
}
