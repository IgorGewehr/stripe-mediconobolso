/**
 * API Routes for TISS Service - Proxy to Rust Microservice
 * Base endpoint: /api/tiss
 */

import { NextResponse } from 'next/server';

const TISS_SERVICE_URL = process.env.TISS_SERVICE_URL || 'http://localhost:8080/api/v1';

/**
 * Generic proxy function to forward requests to TISS microservice
 */
async function proxyToTissService(endpoint, options = {}) {
  try {
    const response = await fetch(`${TISS_SERVICE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('TISS Service Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao comunicar com o serviço TISS',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tiss - Health check and stats
 */
export async function GET() {
  return proxyToTissService('/health');
}

/**
 * POST /api/tiss - General endpoint for complex operations
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'stats':
        return proxyToTissService('/stats');

      default:
        return NextResponse.json(
          { success: false, error: 'Ação não reconhecida' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
