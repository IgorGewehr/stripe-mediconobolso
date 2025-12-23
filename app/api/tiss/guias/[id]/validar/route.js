/**
 * API Route for validating a Guia before submission
 * Endpoint: /api/tiss/guias/[id]/validar
 */

import { NextResponse } from 'next/server';

const TISS_SERVICE_URL = process.env.TISS_SERVICE_URL || 'http://localhost:8080/api/v1';

/**
 * GET /api/tiss/guias/[id]/validar - Validate guia
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const response = await fetch(`${TISS_SERVICE_URL}/guias/${id}/validar`);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error validating guia:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao validar guia', details: error.message },
      { status: 500 }
    );
  }
}
