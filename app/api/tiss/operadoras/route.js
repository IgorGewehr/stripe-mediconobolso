/**
 * API Routes for Operadoras (Health Insurance Providers)
 * Endpoint: /api/tiss/operadoras
 */

import { NextResponse } from 'next/server';

const TISS_SERVICE_URL = process.env.TISS_SERVICE_URL || 'http://localhost:8080/api/v1';

/**
 * GET /api/tiss/operadoras - List all active operadoras
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let endpoint = '/convenios';
    if (search) {
      endpoint = `/convenios?search=${encodeURIComponent(search)}`;
    }

    const response = await fetch(`${TISS_SERVICE_URL}${endpoint}`);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching operadoras:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar operadoras', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tiss/operadoras - Create new operadora
 */
export async function POST(request) {
  try {
    const body = await request.json();

    const response = await fetch(`${TISS_SERVICE_URL}/convenios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating operadora:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar operadora', details: error.message },
      { status: 500 }
    );
  }
}
