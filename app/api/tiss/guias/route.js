/**
 * API Routes for Guias (TISS Documents)
 * Endpoint: /api/tiss/guias
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const TISS_SERVICE_URL = process.env.TISS_SERVICE_URL || 'http://localhost:8080/api/v1';

/**
 * GET /api/tiss/guias - List guias with filters
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

    // Build query string from search params
    const queryParams = new URLSearchParams();

    // Map frontend params to backend params
    // Note: doctor_id (Firebase UID) is NOT passed to backend
    // The backend uses auth context for tenant filtering
    const paramMapping = {
      'operadora_id': 'convenio_id',
      'beneficiario_id': 'paciente_id',
      'status': 'status',
      'tipo_guia': 'tipo',
      'data_inicio': 'data_inicio',
      'data_fim': 'data_fim',
      'page': 'page',
      'per_page': 'per_page',
    };

    Object.entries(paramMapping).forEach(([frontendKey, backendKey]) => {
      const value = searchParams.get(frontendKey);
      if (value) {
        queryParams.append(backendKey, value);
      }
    });

    const response = await fetch(
      `${TISS_SERVICE_URL}/billing/guias?${queryParams.toString()}`,
      {
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json',
        },
      }
    );

    // Handle empty response
    const text = await response.text();
    if (!text) {
      return NextResponse.json({ guias: [], total: 0 }, { status: 200 });
    }

    // Try to parse as JSON, handle plain text error responses
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Backend returned plain text error
      return NextResponse.json(
        { success: false, error: text || 'Erro ao buscar guias' },
        { status: response.status }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || 'Erro ao buscar guias' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching guias:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar guias', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tiss/guias - Create new guia
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

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['doctor_id', 'tipo_guia', 'data_atendimento'];
    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Campos obrigatórios faltando: ${missingFields.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${TISS_SERVICE_URL}/billing/guias`, {
      method: 'POST',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    if (!text) {
      return NextResponse.json(
        { success: false, error: 'Resposta vazia do servidor' },
        { status: 500 }
      );
    }

    // Try to parse as JSON, handle plain text error responses
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { success: false, error: text || 'Erro ao criar guia' },
        { status: response.status }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || 'Erro ao criar guia' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating guia:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar guia', details: error.message },
      { status: 500 }
    );
  }
}
