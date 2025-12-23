/**
 * API Routes for Financial (Contas a Receber)
 * Endpoint: /api/tiss/financeiro
 */

import { NextResponse } from 'next/server';

const TISS_SERVICE_URL = process.env.TISS_SERVICE_URL || 'http://localhost:8080/api/v1';

/**
 * GET /api/tiss/financeiro - List contas a receber or get resumo/previsao
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const doctorId = searchParams.get('doctor_id');

    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: 'doctor_id é obrigatório' },
        { status: 400 }
      );
    }

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

      endpoint = `/contas-receber/resumo?doctor_id=${doctorId}&data_inicio=${dataInicio}&data_fim=${dataFim}`;
    } else if (action === 'previsao') {
      const meses = searchParams.get('meses') || '3';
      endpoint = `/contas-receber/previsao?doctor_id=${doctorId}&meses=${meses}`;
    } else {
      // List contas a receber
      const queryParams = new URLSearchParams();
      queryParams.append('doctor_id', doctorId);

      const params = ['operadora_id', 'status', 'data_inicio', 'data_fim', 'page', 'per_page'];
      params.forEach((param) => {
        const value = searchParams.get(param);
        if (value) queryParams.append(param, value);
      });

      endpoint = `/contas-receber?${queryParams.toString()}`;
    }

    const response = await fetch(`${TISS_SERVICE_URL}${endpoint}`);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
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
        response = await fetch(`${TISS_SERVICE_URL}/contas-receber/lote/${data.lote_id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        response = await fetch(`${TISS_SERVICE_URL}/contas-receber/${data.conta_id}/recebimento`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        response = await fetch(`${TISS_SERVICE_URL}/contas-receber`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
    }

    const responseData = await response.json();
    return NextResponse.json(responseData, { status: response.status });
  } catch (error) {
    console.error('Error in financial operation:', error);
    return NextResponse.json(
      { success: false, error: 'Erro na operação financeira', details: error.message },
      { status: 500 }
    );
  }
}
