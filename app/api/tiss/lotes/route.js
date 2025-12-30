/**
 * API Routes for Lotes (Billing Batches)
 * Endpoint: /api/tiss/lotes
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const TISS_SERVICE_URL = process.env.TISS_SERVICE_URL || 'http://localhost:8080/api/v1';

/**
 * Safely parse JSON response
 */
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
 * GET /api/tiss/lotes - List lotes with filters
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
    // Note: doctor_id is NOT passed - backend uses auth context
    const queryParams = new URLSearchParams();

    const paramMapping = {
      'operadora_id': 'convenio_id',
      'status': 'status',
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
      `${TISS_SERVICE_URL}/billing/lotes?${queryParams.toString()}`,
      {
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await safeJsonParse(response, { lotes: [], total: 0 });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || 'Erro ao buscar lotes' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching lotes:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar lotes', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tiss/lotes - Create new lote
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

    // Validate required fields (doctor_id not needed - backend uses auth)
    const requiredFields = [
      'operadora_id',
      'data_inicio_competencia',
      'data_fim_competencia',
      'guia_ids',
    ];
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

    if (!Array.isArray(body.guia_ids) || body.guia_ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'O lote deve conter pelo menos uma guia',
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${TISS_SERVICE_URL}/billing/lotes`, {
      method: 'POST',
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await safeJsonParse(response, {});

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || data.message || 'Erro ao criar lote' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating lote:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar lote', details: error.message },
      { status: 500 }
    );
  }
}
