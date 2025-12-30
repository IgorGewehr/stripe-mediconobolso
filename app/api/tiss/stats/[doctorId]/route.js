/**
 * API Route for TISS Statistics
 * Endpoint: /api/tiss/stats/[doctorId]
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
 * GET /api/tiss/stats/[doctorId] - Get statistics for guias and lotes
 */
export async function GET(request, { params }) {
  try {
    const headersList = await headers();
    const authorization = headersList.get('authorization');

    if (!authorization) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { doctorId } = await params;

    const fetchOptions = {
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json',
      },
    };

    // Fetch stats in parallel
    const [guiaStatsRes, loteStatsRes] = await Promise.all([
      fetch(`${TISS_SERVICE_URL}/billing/guias/stats?profissional_id=${doctorId}`, fetchOptions),
      fetch(`${TISS_SERVICE_URL}/billing/lotes/stats?profissional_id=${doctorId}`, fetchOptions),
    ]);

    const guiaStats = await safeJsonParse(guiaStatsRes, { total: 0, por_status: {} });
    const loteStats = await safeJsonParse(loteStatsRes, { total: 0, por_status: {} });

    return NextResponse.json({
      success: true,
      data: {
        guias: guiaStats,
        lotes: loteStats,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar estatísticas', details: error.message },
      { status: 500 }
    );
  }
}
